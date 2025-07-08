
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, date, timedelta
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

app = Flask(__name__)

CORS(app, supports_credentials=True, 
     origins="http://localhost:5173",     
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:admin@localhost:5433/employee_management'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False


app.config['SESSION_COOKIE_SECURE'] = False  
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'  


app.config['JWT_SECRET_KEY'] = 'your_super_secret_session_key'
app.config['SECRET_KEY'] = 'your_super_secret_session_key'

app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)



# Initialize SQLAlchemy
db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    
    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role
        }
    
# Employee model
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    position = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    salary = db.Column(db.Float, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('manager.id'), nullable=True)  # New field
    status = db.Column(db.String(20), default="New Hire")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        manager = Manager.query.get(self.manager_id)
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'position': self.position,
            'department': self.department,
            'start_date': self.start_date.strftime('%Y-%m-%d'),
            'salary': self.salary,
            'phone': self.phone,
            'manager_id': self.manager_id,
            'manager_name': manager.name if manager else None,  # Include manager name
            'status': self.status
        }

# Manager model
class Manager(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    direct_reports = db.Column(db.Integer, default=0)
    hire_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'title': self.title,
            'email': self.email,
            'phone': self.phone,
            'department': self.department,
            'directReports': self.direct_reports,
            'hireDate': self.hire_date.strftime('%Y-%m-%d'),
            'status': self.status,
            'avatarInitial': ''.join([n[0] for n in self.name.split()])
        }
    
class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='Not Started')
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'taskCount': len(self.tasks)
        }
    

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    deadline = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(50), default='Not Started')
    projectId = db.Column(db.Integer, db.ForeignKey('project.id'), nullable=False)
    assignedTo = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'status': self.status,
            'projectId': self.projectId,
            'assignedTo': self.assignedTo

        }
class TimeEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time_in = db.Column(db.DateTime, nullable=False)
    time_out = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default="In")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'date': self.date.strftime('%Y-%m-%d'),
            'time_in': self.time_in.isoformat(),
            'time_out': self.time_out.isoformat() if self.time_out else None,
            'status': self.status
        }

# EmployeeTask model for tracking tasks assigned to employees
class EmployeeTask(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default='Pending')
    due_date = db.Column(db.Date, nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('manager.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    priority = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'status': self.status,
            'due_date': self.due_date.strftime('%Y-%m-%d'),
            'assigned_by': self.assigned_by,
            'assigned_by_name': Manager.query.get(self.assigned_by).name if self.assigned_by else None,
            'assigned_to': self.assigned_to,
            'priority': self.priority
        }

# PerformanceMetric model for employee performance tracking
class PerformanceMetric(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    tasks_completed = db.Column(db.Integer, default=0)
    tasks_in_progress = db.Column(db.Integer, default=0)
    projects_contributed = db.Column(db.Integer, default=0)
    average_task_completion = db.Column(db.Float, default=0.0)  # in days
    on_time_completion_rate = db.Column(db.Float, default=0.0)  # percentage
    last_updated = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'tasks_completed': self.tasks_completed,
            'tasks_in_progress': self.tasks_in_progress,
            'projects_contributed': self.projects_contributed,
            'average_task_completion': self.average_task_completion,
            'on_time_completion_rate': self.on_time_completion_rate,
            'last_updated': self.last_updated.isoformat()
        }

# LeaveRequest model for employee leave management
class LeaveRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Annual, Sick, Personal
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected, Taken
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'type': self.type,
            'start_date': self.start_date.strftime('%Y-%m-%d'),
            'end_date': self.end_date.strftime('%Y-%m-%d'),
            'status': self.status
        }

# LeaveBalance model for tracking available leave days
class LeaveBalance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    annual = db.Column(db.Integer, default=15)
    sick = db.Column(db.Integer, default=10)
    personal = db.Column(db.Integer, default=5)
    year = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'annual': self.annual,
            'sick': self.sick,
            'personal': self.personal,
            'year': self.year
        }

# Update Employee model with relationships
def update_employee_model():
    Employee.time_entries = db.relationship('TimeEntry', backref='employee', lazy=True)
    Employee.tasks = db.relationship('EmployeeTask', backref='employee', lazy=True, foreign_keys='EmployeeTask.assigned_to')
    Employee.leaves = db.relationship('LeaveRequest', backref='employee', lazy=True)
    Employee.leave_balances = db.relationship('LeaveBalance', backref='employee', lazy=True)
    Employee.performance = db.relationship('PerformanceMetric', backref='employee', uselist=False, lazy=True)

# Update Manager model with relationships
def update_manager_model():
    Manager.assigned_tasks = db.relationship('EmployeeTask', backref='manager', lazy=True, foreign_keys='EmployeeTask.assigned_by')
# Initialize the database with an HR user
def init_db():
    with app.app_context():

        db.create_all()
        
        hr_user = User.query.filter_by(username='hr_user').first()

        if not hr_user:
            default_hr = User(
                username='hr_user',
                password=generate_password_hash('hr123'),
                role='hr'
            )
            db.session.add(default_hr)
            db.session.commit()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password, password):

        token = jwt.encode({
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, app.config['JWT_SECRET_KEY'])
        
        return jsonify({
            'success': True,
            'token': token,
            'username': user.username,
            'role': user.role
        })
    
    return jsonify({
        'success': False,
        'message': 'Invalid username or password'
    }), 401
# Create a helper function to verify tokens
def verify_token(token):
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None  
    except jwt.InvalidTokenError:
        return None  

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({'success': True})

@app.route('/api/users', methods=['GET'])
def list_users():
    # Check if user is authenticated and is HR
    if 'user' not in session or session['user']['role'] != 'hr':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    users = User.query.all()
    safe_users = [user.to_dict() for user in users]
    
    return jsonify({
        'success': True,
        'users': safe_users
    })

@app.route('/api/users', methods=['POST'])
def create_user():
    # Check if user is authenticated and is HR
    if 'user' not in session or session['user']['role'] != 'hr':
        return jsonify({
            'success': False,
            'message': 'Unauthorized'
        }), 403
    
    data = request.get_json()
    username = data.get('username')
    role = data.get('role')
    
    if not username or not role or role not in ['manager', 'employee']:
        return jsonify({
            'success': False,
            'message': 'Invalid user data'
        }), 400
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'Username already exists'
        }), 409
    
    # Generate default password based on role
    default_password = f"{role}123"
    
    # Create new user
    new_user = User(
        username=username,
        password=generate_password_hash(default_password),
        role=role
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'username': username,
            'role': role,
            'default_password': default_password  
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error creating user: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to create user'
        }), 500

@app.route('/api/current_user', methods=['GET'])
def get_current_user():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': 'Missing or invalid authorization header'
        }), 401
    
    token = auth_header.split(' ')[1]
    user_data = verify_token(token)
    
    if user_data:
        return jsonify({
            'success': True,
            'user': {
                'username': user_data['username'],
                'role': user_data['role']
            }
        })
    
    return jsonify({
        'success': False,
        'message': 'Invalid or expired token'
    }), 401


# Employee CRUD endpoints

@app.route('/api/employees', methods=['GET'])
def get_employees():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': 'Missing or invalid authorization header'
        }), 401
    
    token = auth_header.split(' ')[1]
    user_data = verify_token(token)
    
    if not user_data:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired token'
        }), 401
    
    employees = Employee.query.all()
    employee_list = [emp.to_dict() for emp in employees]
    
    return jsonify({
        'success': True,
        'employees': employee_list
    })

# Similarly update other employee endpoints

@app.route('/api/employees', methods=['POST'])
def add_employee():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Forbidden'}), 403

    data = request.get_json()

    # Validate required fields
    required_fields = ['name', 'email', 'position', 'department', 'startDate', 'manager']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({'success': False, 'message': f'Missing required fields: {", ".join(missing_fields)}'}), 400

    existing_employee = Employee.query.filter_by(email=data.get('email')).first()
    if existing_employee:
        return jsonify({'success': False, 'message': 'Employee with this email already exists'}), 400

    existing_user = User.query.filter_by(username=data.get('email')).first()
    if existing_user:
        return jsonify({'success': False, 'message': 'User with this email already exists'}), 400

    # Check if the manager exists
    manager_id = data.get('manager')
    manager = Manager.query.get(manager_id)
    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 400

    try:

        start_date = datetime.strptime(data.get('startDate'), '%Y-%m-%d').date()

        salary = float(data.get('salary')) if data.get('salary') else None

        new_employee = Employee(
            name=data.get('name'),
            email=data.get('email'),
            position=data.get('position'),
            department=data.get('department'),
            start_date=start_date,
            salary=salary,
            phone=data.get('phone'),
            manager_id=manager_id,
            status=data.get('status', 'New Hire')
        )

        db.session.add(new_employee)

 
        default_password = 'employee123'
        new_user = User(
            username=data.get('email'),
            password=generate_password_hash(default_password),
            role='employee'
        )

        db.session.add(new_user)

        db.session.commit()

        return jsonify({
            'success': True,
            'employee': new_employee.to_dict(),
            'login': {
                'username': new_user.username,
                'default_password': default_password
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error adding employee and user: {e}")
        return jsonify({'success': False, 'message': 'Internal server error'}), 500


@app.route('/api/employees/<int:employee_id>', methods=['GET'])
def get_employee(employee_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401

    
    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({
            'success': False,
            'message': 'Employee not found'
        }), 404
    
    return jsonify({
        'success': True,
        'employee': employee.to_dict()
    })

@app.route('/api/employees/<int:employee_id>', methods=['PUT'])
def update_employee(employee_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    data = request.get_json()

    try:
        if 'name' in data:
            employee.name = data['name']
        if 'email' in data:
            if data['email'] != employee.email:
                existing_employee = Employee.query.filter_by(email=data['email']).first()
                if existing_employee:
                    return jsonify({'success': False, 'message': 'Email already exists'}), 409
            employee.email = data['email']
        if 'position' in data:
            employee.position = data['position']
        if 'department' in data:
            employee.department = data['department']
        if 'startDate' in data:
            employee.start_date = datetime.strptime(data['startDate'], '%Y-%m-%d').date()
        if 'salary' in data:
            employee.salary = float(data['salary']) if data['salary'] else None
        if 'phone' in data:
            employee.phone = data['phone']
        if 'manager' in data:
            employee.manager = data['manager']
        if 'status' in data:
            employee.status = data['status']

        db.session.commit()

        return jsonify({'success': True, 'employee': employee.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating employee: {e}")
        return jsonify({'success': False, 'message': f'Failed to update employee: {str(e)}'}), 500
    
@app.route('/api/employees/<int:employee_id>', methods=['DELETE'])
def delete_employee(employee_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    try:
        db.session.delete(employee)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Employee deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete employee: {e}'}), 500

@app.route('/api/employees/<int:employee_id>/assign_manager', methods=['POST'])
def assign_manager(employee_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    data = request.get_json()
    manager_id = data.get('managerId')

    if not manager_id:
        return jsonify({'success': False, 'message': 'Manager ID is required'}), 400

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    manager = Manager.query.get(manager_id)
    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 404

    try:
        employee.manager_id = manager_id  # Store manager ID
        db.session.commit()
        return jsonify({'success': True, 'message': 'Manager assigned successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'Failed to assign manager', 'error': str(e)}), 500

# Manager CRUD endpoints
@app.route('/api/managers', methods=['GET'])
def get_managers():
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({
            'success': False,
            'message': 'Missing or invalid authorization header'
        }), 401
    
    token = auth_header.split(' ')[1]
    user_data = verify_token(token)
    
    if not user_data:
        return jsonify({
            'success': False,
            'message': 'Invalid or expired token'
        }), 401
    
    managers = Manager.query.all()
    manager_list = [mgr.to_dict() for mgr in managers]
    
    return jsonify({
        'success': True,
        'managers': manager_list
    })

@app.route('/api/managers', methods=['POST'])
def add_manager():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    data = request.get_json()


    required_fields = ['name', 'email', 'title', 'department', 'phone', 'hireDate']
    for field in required_fields:
        if not data.get(field):
            return jsonify({
                'success': False,
                'message': f'Missing required field: {field}'
            }), 400


    existing_manager = Manager.query.filter_by(email=data.get('email')).first()
    existing_employee = Employee.query.filter_by(email=data.get('email')).first()
    
    if existing_manager or existing_employee:
        return jsonify({
            'success': False,
            'message': 'Email already exists'
        }), 409

  
    existing_user = User.query.filter_by(username=data.get('email')).first()
    if existing_user:
        return jsonify({
            'success': False,
            'message': 'A user with this email already exists'
        }), 409

    try:

        hire_date = datetime.strptime(data.get('hireDate'), '%Y-%m-%d').date()


        direct_reports = int(data.get('directReports', 0))

        new_manager = Manager(
            name=data.get('name'),
            title=data.get('title'),
            email=data.get('email'),
            phone=data.get('phone'),
            department=data.get('department'),
            direct_reports=direct_reports,
            hire_date=hire_date,
            status=data.get('status', 'Active')
        )

        db.session.add(new_manager)


        default_password = 'manager123'
        new_user = User(
            username=data.get('email'),
            password=generate_password_hash(default_password),
            role='manager'
        )

        db.session.add(new_user)

        db.session.commit()

        return jsonify({
            'success': True,
            'manager': new_manager.to_dict(),
            'login': {
                'username': new_user.username,
                'default_password': default_password
            }
        })
    except Exception as e:
        db.session.rollback()
        print(f"Error adding manager and user: {e}")
        return jsonify({
            'success': False,
            'message': f'Failed to add manager and user: {str(e)}'
        }), 500

@app.route('/api/managers/<int:manager_id>', methods=['GET'])
def get_manager(manager_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Invalid or expired token'}), 401
    
    manager = Manager.query.get(manager_id)
    if not manager:
        return jsonify({
            'success': False,
            'message': 'Manager not found'
        }), 404
    
    return jsonify({
        'success': True,
        'manager': manager.to_dict()
    })

@app.route('/api/managers/<int:manager_id>', methods=['PUT'])
def update_manager(manager_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    manager = Manager.query.get(manager_id)
    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 404

    data = request.get_json()

    try:
        if 'name' in data:
            manager.name = data['name']
        if 'title' in data:
            manager.title = data['title']
        if 'email' in data:
            if data['email'] != manager.email:
                existing_manager = Manager.query.filter_by(email=data['email']).first()
                existing_employee = Employee.query.filter_by(email=data['email']).first()
                if existing_manager or existing_employee:
                    return jsonify({'success': False, 'message': 'Email already exists'}), 409
            manager.email = data['email']
        if 'phone' in data:
            manager.phone = data['phone']
        if 'department' in data:
            manager.department = data['department']
        if 'directReports' in data:
            manager.direct_reports = int(data['directReports'])
        if 'hireDate' in data:
            manager.hire_date = datetime.strptime(data['hireDate'], '%Y-%m-%d').date()
        if 'status' in data:
            manager.status = data['status']

        db.session.commit()

        return jsonify({'success': True, 'manager': manager.to_dict()})
    except Exception as e:
        db.session.rollback()
        print(f"Error updating manager: {e}")
        return jsonify({'success': False, 'message': f'Failed to update manager: {str(e)}'}), 500
    
@app.route('/api/managers/<int:manager_id>', methods=['DELETE'])
def delete_manager(manager_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'hr':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    manager = Manager.query.get(manager_id)
    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 404

    try:

        db.session.delete(manager)
        
  
        user = User.query.filter_by(username=manager.email).first()
        if user:
            db.session.delete(user)
            
        db.session.commit()
        return jsonify({'success': True, 'message': 'Manager deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Failed to delete manager: {e}'}), 500
    

@app.route('/api/projects', methods=['GET', 'POST'])
def handle_projects():
    if request.method == 'GET':
        projects = Project.query.all()
        return jsonify([project.to_dict() for project in projects])
    else:  # POST
        data = request.json
        deadline = datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
        new_project = Project(
            name=data['name'],
            deadline=deadline,
            status=data.get('status', 'Not Started')
        )
        db.session.add(new_project)
        db.session.commit()
        return jsonify(new_project.to_dict()), 201

@app.route('/api/projects/<int:project_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_project(project_id):
    project = Project.query.get_or_404(project_id)
    
    if request.method == 'GET':
        return jsonify(project.to_dict())
    
    elif request.method == 'PUT':
        data = request.json
        project.name = data.get('name', project.name)
        if 'deadline' in data and data['deadline']:
            project.deadline = datetime.fromisoformat(data['deadline'])
        project.status = data.get('status', project.status)
        db.session.commit()
        return jsonify(project.to_dict())
    
    else:  
        db.session.delete(project)
        db.session.commit()
        return '', 204

@app.route('/api/tasks', methods=['GET', 'POST'])
def handle_tasks():
    if request.method == 'GET':

        project_id = request.args.get('projectId')
        assigned_to = request.args.get('assignedTo')

        if project_id:
            tasks = Task.query.filter_by(projectId=project_id).all()

        if assigned_to:
            tasks = Task.query.filter_by(assignedTo=assigned_to)

        if not project_id and not assigned_to:

            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

            token = auth_header.split(' ')[1]
            user_data = verify_token(token)

            if not user_data:
                return jsonify({'success': False, 'message': 'Unauthorized'}), 403


            employee = Employee.query.filter_by(email=user_data['username']).first()
            if not employee:
                return jsonify({'success': False, 'message': 'Employee not found'}), 404

            tasks = Task.query.filter_by(assignedTo=employee.id).all()
            return jsonify([task.to_dict() for task in tasks])
        else:
            tasks = Task.query.all()
        return jsonify([task.to_dict() for task in tasks])
    else:  
        data = request.json
        deadline = datetime.fromisoformat(data['deadline']) if data.get('deadline') else None
        new_task = Task(
            title=data['title'],
            description=data.get('description', ''),
            deadline=deadline,
            status=data.get('status', 'Not Started'),
            projectId=data['projectId'],
            assignedTo=data.get('assignedTo')
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify(new_task.to_dict()), 201

@app.route('/api/tasks/<int:task_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_task(task_id):
    task = Task.query.get_or_404(task_id)
    
    if request.method == 'GET':
        return jsonify(task.to_dict())
    
    elif request.method == 'PUT':
        data = request.json
        task.title = data.get('title', task.title)
        task.description = data.get('description', task.description)
        if 'deadline' in data and data['deadline']:
            task.deadline = datetime.fromisoformat(data['deadline'])
        task.status = data.get('status', task.status)
        task.projectId = data.get('projectId', task.projectId)
        task.assignedTo = data.get('assignedTo', task.assignedTo)
        db.session.commit()
        return jsonify(task.to_dict())
    
    else:  
        db.session.delete(task)
        db.session.commit()
        return '', 204

@app.route('/api/employee/profile', methods=['GET'])
def get_employee_profile():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    user_email = user_data['username']
    employee = Employee.query.filter_by(email=user_email).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404

    return jsonify({'success': True, 'employee': employee.to_dict()})


# Time Tracking APIs
@app.route('/api/time-tracking/status', methods=['GET'])
def get_time_status():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    today = date.today()

    time_entry = TimeEntry.query.filter_by(
        employee_id=employee_id, 
        date=today
    ).order_by(TimeEntry.created_at.desc()).first()
    
    if not time_entry:
        return jsonify(status="Out", time_in=None, time_out=None)
    
    return jsonify(
        status=time_entry.status,
        time_in=time_entry.time_in.isoformat() if time_entry.time_in else None,
        time_out=time_entry.time_out.isoformat() if time_entry.time_out else None
    )

@app.route('/api/time-tracking/clock', methods=['POST'])
def clock_time():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    data = request.get_json()
    action = data.get('action')  
    today = date.today()
    now = datetime.utcnow()
    

    time_entry = TimeEntry.query.filter_by(
        employee_id=employee_id, 
        date=today,
        status="In"
    ).first()
    
    if action == 'in':
        if time_entry:
            return jsonify(success=False, message="Already clocked in"), 400
        
        new_entry = TimeEntry(
            employee_id=employee_id,
            date=today,
            time_in=now,
            status="In"
        )
        db.session.add(new_entry)
        db.session.commit()
        
        return jsonify(
            success=True, 
            status="In", 
            time_in=new_entry.time_in.isoformat()
        )
    
    elif action == 'out':
        if not time_entry:
            return jsonify(success=False, message="Not clocked in"), 400
        
        time_entry.time_out = now
        time_entry.status = "Out"
        db.session.commit()
        
        return jsonify(
            success=True, 
            status="Out", 
            time_in=time_entry.time_in.isoformat(),
            time_out=time_entry.time_out.isoformat()
        )
    
    return jsonify(success=False, message="Invalid action"), 400

@app.route('/api/time-tracking/history', methods=['GET'])
def get_time_history():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    

    entries = TimeEntry.query.filter(
        TimeEntry.employee_id == employee_id,
        TimeEntry.date >= date.today() - timedelta(days=7)
    ).order_by(TimeEntry.date.desc()).all()
    
    history = []
    for entry in entries:
        history.append({
            'date': entry.date.strftime('%Y-%m-%d'),
            'timeIn': entry.time_in.strftime('%H:%M:%S') if entry.time_in else None,
            'timeOut': entry.time_out.strftime('%H:%M:%S') if entry.time_out else None
        })
    
    return jsonify(history=history)

# Task Management APIs
@app.route('/api/tasks', methods=['GET'])
def get_employee_tasks():
  
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    
    tasks = EmployeeTask.query.filter_by(assigned_to=employee_id).all()
    task_list = []
    
    for task in tasks:
        manager = Manager.query.get(task.assigned_by)
        task_data = task.to_dict()
        task_data['assignedBy'] = manager.name if manager else "Unknown"
        task_list.append(task_data)
    
    return jsonify(tasks=task_list)

@app.route('/api/tasks/<int:task_id>/status', methods=['PUT'])
def update_task_status(task_id):

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    data = request.get_json()
    new_status = data.get('status')
    
    print(f"Debug: Task ID {task_id} requested by employee ID {employee_id}")
    task = Task.query.filter_by(id=task_id, assignedTo=employee_id).first()
    if not task:
        print(f"Debug: Task with ID {task_id} not found or not assigned to employee ID {employee_id}")
        return jsonify(success=False, message="Task not found"), 404
    

    old_status = task.status
    task.status = new_status
    db.session.commit()
    

    project = Project.query.get(task.projectId)
    if project:
        if any(t.status in ['In Progress', 'Completed'] for t in project.tasks):
            project.status = 'On Going'
            db.session.commit()
    

    update_performance_metrics(employee_id, old_status, new_status)
    
    return jsonify(success=True, task=task.to_dict())


@app.route('/api/performance-metrics', methods=['GET'])
def get_performance_metrics():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    
    metrics = PerformanceMetric.query.filter_by(employee_id=employee_id).first()
    if not metrics:

        metrics = PerformanceMetric(employee_id=employee_id)
        db.session.add(metrics)
        db.session.commit()
    
    return jsonify(metrics=metrics.to_dict())

# Leave Management APIs
@app.route('/api/leave-balance', methods=['GET'])
def get_leave_balance():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    current_year = datetime.now().year
    
    balance = LeaveBalance.query.filter_by(
        employee_id=employee_id,
        year=current_year
    ).first()
    
    if not balance:

        balance = LeaveBalance(
            employee_id=employee_id,
            year=current_year
        )
        db.session.add(balance)
        db.session.commit()
    
    return jsonify(leaveBalance=balance.to_dict())

@app.route('/api/leave-history', methods=['GET'])
def get_leave_history():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    
    leaves = LeaveRequest.query.filter_by(employee_id=employee_id).order_by(
        LeaveRequest.start_date.desc()
    ).all()
    
    leave_list = [leave.to_dict() for leave in leaves]
    return jsonify(leaveHistory=leave_list)

@app.route('/api/leave-request', methods=['POST'])
def create_leave_request():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    data = request.get_json()
    

    if not all(key in data for key in ['type', 'startDate', 'endDate']):
        return jsonify(success=False, message="Missing required fields"), 400
    

    leave_request = LeaveRequest(
        employee_id=employee_id,
        type=data['type'],
        start_date=datetime.strptime(data['startDate'], '%Y-%m-%d').date(),
        end_date=datetime.strptime(data['endDate'], '%Y-%m-%d').date(),
        status='Pending'
    )
    
    db.session.add(leave_request)
    db.session.commit()
    
    return jsonify(success=True, leave=leave_request.to_dict())

# Upcoming Deadlines API
@app.route('/api/upcoming-deadlines', methods=['GET'])
def get_upcoming_deadlines():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    

    employee = Employee.query.filter_by(email=user_data['username']).first()
    if not employee:
        return jsonify({'success': False, 'message': 'Employee not found'}), 404
    
    employee_id = employee.id
    
    tasks = EmployeeTask.query.filter(
        EmployeeTask.assigned_to == employee_id,
        EmployeeTask.status != 'Completed',
        EmployeeTask.due_date >= date.today()
    ).order_by(EmployeeTask.due_date).limit(3).all()
    
    deadlines = []
    for task in tasks:
        manager = Manager.query.get(task.assigned_by)
        deadlines.append({
            'id': task.id,
            'title': task.title,
            'dueDate': task.due_date.strftime('%Y-%m-%d'),
            'priority': task.priority,
            'assignedBy': manager.name if manager else "Unknown"
        })
    
    return jsonify(deadlines=deadlines)

# Helper Functions - Update to match new authentication approach
def update_performance_metrics(employee_id, old_status, new_status):
    metrics = PerformanceMetric.query.filter_by(employee_id=employee_id).first()
    
    if not metrics:
        metrics = PerformanceMetric(employee_id=employee_id)
        db.session.add(metrics)
    

    if old_status != 'Completed' and new_status == 'Completed':
        metrics.tasks_completed += 1
    elif old_status == 'Completed' and new_status != 'Completed':
        metrics.tasks_completed -= 1

    in_progress_count = EmployeeTask.query.filter_by(
        assigned_to=employee_id,
        status='In Progress'
    ).count()
    metrics.tasks_in_progress = in_progress_count

    completed_tasks = EmployeeTask.query.filter(
        EmployeeTask.assigned_to == employee_id,
        EmployeeTask.status == 'Completed'
    ).all()
    
    if completed_tasks:
        on_time_count = sum(1 for task in completed_tasks 
                            if task.due_date and datetime.combine(task.due_date, datetime.min.time()) >= task.created_at)
        metrics.on_time_completion_rate = (on_time_count / len(completed_tasks)) * 100
    

    if completed_tasks:
        total_days = 0
        for task in completed_tasks:

            task_history = TaskHistory.query.filter_by(
                task_id=task.id, 
                new_status='Completed'
            ).first()
            
            if task_history and task_history.created_at and task.created_at:
                completion_days = (task_history.created_at - task.created_at).days
                total_days += max(completion_days, 0)
        
        metrics.average_task_completion = total_days / len(completed_tasks) if len(completed_tasks) > 0 else 0
    

    project_count = db.session.query(func.count(func.distinct(Task.projectId))).filter(
        Task.assignedTo == employee_id
    ).scalar()
    metrics.projects_contributed = project_count or 0
    
    metrics.last_updated = datetime.utcnow()
    db.session.commit()

@app.route('/api/manager/employees', methods=['GET'])
def get_manager_employees():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Missing or invalid token'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'manager':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    manager_email = user_data['username']
    manager = Manager.query.filter_by(email=manager_email).first()

    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 404

    employees = Employee.query.filter_by(manager_id=manager.id).all()
    employee_list = [employee.to_dict() for employee in employees]

    return jsonify({'success': True, 'employees': employee_list})

@app.route('/api/manager/tasks', methods=['GET'])
def get_manager_tasks():

    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401

    token = auth_header.split(' ')[1]
    user_data = verify_token(token)

    if not user_data or user_data['role'] != 'manager':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401


    manager_email = user_data['username']
    manager = Manager.query.filter_by(email=manager_email).first()

    if not manager:
        return jsonify({'success': False, 'message': 'Manager not found'}), 404


    employees = Employee.query.filter_by(manager_id=manager.id).all()
    employee_ids = [employee.id for employee in employees]


    tasks = Task.query.filter(Task.assignedTo.in_(employee_ids)).all()
    task_list = [task.to_dict() for task in tasks]

    return jsonify({'success': True, 'tasks': task_list})


@app.route('/api/stats', methods=['GET'])
def get_stats():

    total_employees = Employee.query.count()

    new_hires = Employee.query.filter_by(status="New Hire").count()

    today = date.today()
    total_time_entries = TimeEntry.query.filter_by(date=today).count()
    attendance_rate = (total_time_entries / total_employees) * 100 if total_employees > 0 else 0

    total_managers = Manager.query.count()

    return jsonify({
        'totalEmployees': total_employees,
        'newHires': new_hires,
        'attendanceRate': f"{attendance_rate:.2f}%",
        'managers': total_managers
    })

if __name__ == '__main__':
    init_db() 
    app.run(debug=True)
