# pomodoro.py
from flask import Blueprint, render_template, request, jsonify, session

pomodoro_bp = Blueprint(
    'pomodoro',
    __name__,
    template_folder='templates',
    static_folder='static',
    static_url_path='/static'
)

@pomodoro_bp.route('/', methods=['GET'])
def pomodoro():
    cycles = session.get('cycles', 4)
    pomodoro_length = session.get('pomodoro_length', 25)
    break_time = session.get('break_time', 5)
    long_break = session.get('long_break', 15)
    timer_state = session.get('timer_state', 'stopped')  # optional: running/paused/stopped
    remaining_seconds = session.get('remaining_seconds', pomodoro_length*60)

    return render_template(
        'pomodoro.html',
        cycles=cycles,
        pomodoro_length=pomodoro_length,
        break_time=break_time,
        long_break=long_break,
        timer_state=timer_state,
        remaining_seconds=remaining_seconds
    )

@pomodoro_bp.route('/update', methods=['POST'])
def update_timer():
    data = request.get_json()
    session['cycles'] = int(data.get('cycles', 4))
    session['pomodoro_length'] = int(data.get('pomodoro_length', 25))
    session['break_time'] = int(data.get('break_time', 5))
    session['long_break'] = int(data.get('long_break', 15))
    session['timer_state'] = data.get('timer_state', 'stopped')
    session['remaining_seconds'] = data.get('remaining_seconds', session['pomodoro_length']*60)

    return jsonify({'status': 'ok'})
