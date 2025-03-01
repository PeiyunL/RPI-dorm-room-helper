from flask import Flask, render_template
import sqlite3
import os

app = Flask(__name__)

# Path to your SQLite database file (adjust as necessary)
DB_PATH = r"C:\Users\pylpf\RPI-dorm-room-helper\backend\db\db"
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # So you can access columns by name
    return conn

@app.route('/barton-hall')
def barton_hall():
    conn = get_db_connection()
    pricing = conn.execute('SELECT * FROM Barton_Hall').fetchall()
    conn.close()
    return render_template('Barton_Hall_testing.html', pricing=pricing)

if __name__ == '__main__':
    app.run(debug=True)
