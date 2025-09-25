from flask import Flask, render_template
import os
from dotenv import load_dotenv


load_dotenv()

from apps.todo.app import todo_bp
from apps.currency.app import currency_bp
from apps.pomodoro.app import pomodoro_bp
from apps.expensetracker.app import expensetracker_bp

app = Flask(__name__)


app.secret_key = os.environ.get("FLASK_SECRET_KEY")


FLASK_ENV = os.environ.get("FLASK_ENV", "development")
is_production = FLASK_ENV.lower() == "production"


app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=is_production,
)


@app.route("/")
def index():
    return render_template("portfolio_index.html")


app.register_blueprint(todo_bp, url_prefix="/todo")
app.register_blueprint(currency_bp, url_prefix="/currency")
app.register_blueprint(pomodoro_bp, url_prefix="/pomodoro")
app.register_blueprint(expensetracker_bp, url_prefix="/expenses")

if __name__ == "__main__":
    app.run(debug=not is_production)
