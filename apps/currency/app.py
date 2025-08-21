from flask import Blueprint, render_template, jsonify, session
import json, os, requests
from datetime import datetime, timedelta

currency_bp = Blueprint(
    'currency',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/currency/static'
)

STATIC_DIR   = os.path.join(os.path.dirname(__file__), 'static')
RATES_FILE   = os.path.join(STATIC_DIR, 'rates.json')

@currency_bp.route('/')
def index():
    session.setdefault('base_currency', 'USD')
    return render_template('index.html')

def fetch_rates():
    """Return rates, fetching at most once per day and caching to static/rates.json."""
    if os.path.exists(RATES_FILE):
        try:
            with open(RATES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            last = datetime.fromisoformat(data.get('time_last_fetched', '1970-01-01T00:00:00'))
            if datetime.now() - last < timedelta(days=1):
                return data
        except Exception:
            pass  

    url = "https://api.exchangerate-api.com/v6/latest/USD"
    try:
        r = requests.get(url, timeout=8)
        if r.status_code == 200:
            data = r.json()
            data['time_last_fetched'] = datetime.now().isoformat()
            with open(RATES_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=4)
            return data
    except Exception:
        pass

    if os.path.exists(RATES_FILE):
        with open(RATES_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

@currency_bp.route('/rates.json')
def rates_json():
    data = fetch_rates()
    if not data:
        return jsonify({"error": "Unable to load rates"}), 503
    return jsonify(data)

@currency_bp.route('/set_base/<base>')
def set_base(base):
    session['base_currency'] = base.upper()
    return jsonify({"status": "success", "base_currency": session['base_currency']})
