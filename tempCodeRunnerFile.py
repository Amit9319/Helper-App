from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import bcrypt
import pandas as pd
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Replace with a strong secret key

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

CSV_FILE = 'users.csv'

# Ensure CSV exists
if not os.path.exists(CSV_FILE):
    df = pd.DataFrame(columns=['username', 'password', 'expires'])
    df.to_csv(CSV_FILE, index=False)

# User class for Flask-Login
class User(UserMixin):
    def __init__(self, id, username, password, expires):
        self.id = id
        self.username = username
        self.password = password
        self.expires = expires

# Load user callback
@login_manager.user_loader
def load_user(user_id):
    df = pd.read_csv(CSV_FILE)
    if int(user_id) in df.index:
        row = df.loc[int(user_id)]
        return User(id=int(user_id), username=row['username'], password=row['password'], expires=row['expires'])
    return None

# Signup route (optional, could be admin-only)
@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password'].encode('utf-8')
        expires = request.form.get('expires')  # YYYY-MM-DD

        df = pd.read_csv(CSV_FILE)

        if username in df['username'].values:
            flash('Username already exists!')
            return redirect(url_for('signup'))

        hashed = bcrypt.hashpw(password, bcrypt.gensalt())
        df = pd.concat([df, pd.DataFrame({
            'username': [username],
            'password': [hashed.decode('utf-8')],
            'expires': [expires]
        })], ignore_index=True)
        df.to_csv(CSV_FILE, index=False)
        flash('Signup successful!')
        return redirect(url_for('login'))

    return render_template('signup.html')

# Login route
@app.route('/', methods=['GET', 'POST'])
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password'].encode('utf-8')
        remember = True if request.form.get('remember') else False

        df = pd.read_csv(CSV_FILE)
        user_row = df[df['username'] == username]

        if not user_row.empty:
            stored_password = user_row.iloc[0]['password'].encode('utf-8')
            expires_str = user_row.iloc[0]['expires']
            expires_date = datetime.strptime(expires_str, "%Y-%m-%d").date()

            if datetime.now().date() > expires_date:
                flash('Subscription expired. Please contact admin.')
                return redirect(url_for('login'))

            if bcrypt.checkpw(password, stored_password):
                user_id = user_row.index[0]
                user = User(id=user_id, username=username, password=stored_password, expires=expires_str)
                login_user(user, remember=remember)
                return redirect(url_for('home'))

        flash('Invalid username or password!')
        return redirect(url_for('login'))

    return render_template('login.html')

# Protected home route
@app.route('/home')
@login_required
def home():
    return render_template('home.html', username=current_user.username)

# Logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.')
    return redirect(url_for('login'))

if __name__ == '__main__':
    app.run(debug=True)
