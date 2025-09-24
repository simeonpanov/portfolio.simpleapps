from flask import Blueprint, render_template, request, jsonify, session
from datetime import datetime, date

expensetracker_bp = Blueprint(
    'expensetracker',
    __name__,
    template_folder='templates',
    static_folder='static'
)


default_expense = {
    "id": 1,
    "item": "Sample Item",
    "amount": 0.0,
    "category": "General",
    "date": date.today().strftime("%Y-%m-%d"),
}


@expensetracker_bp.route('/', methods=['GET'])
def expensehtml():
    return render_template('expensetracker.html')


@expensetracker_bp.route('/api', methods=['GET'])
def get_expenses():
    if 'expenses' not in session:
        session['expenses'] = [default_expense.copy()]

    category = request.args.get("category")
    start = request.args.get("start")
    end = request.args.get("end")
    min_amount = request.args.get("min_amount", type=float)
    max_amount = request.args.get("max_amount", type=float)
    sort = request.args.get("sort")
    order = request.args.get("order", "asc")

    filtered = []
    start_date = datetime.strptime(start, "%Y-%m-%d") if start else None
    end_date = datetime.strptime(end, "%Y-%m-%d") if end else None

    for exp in session['expenses']:
        try:
            exp_date = datetime.strptime(exp["date"], "%Y-%m-%d")
        except ValueError:
            continue

        if category and exp["category"] != category:
            continue
        if start_date and exp_date < start_date:
            continue
        if end_date and exp_date > end_date:
            continue
        if min_amount is not None and exp["amount"] < min_amount:
            continue
        if max_amount is not None and exp["amount"] > max_amount:
            continue
        filtered.append(exp)

    if sort:
        reverse = order == "desc"
        if sort == "date":
            filtered.sort(key=lambda x: datetime.strptime(x["date"], "%Y-%m-%d"), reverse=reverse)
        elif sort == "amount":
            filtered.sort(key=lambda x: x["amount"], reverse=reverse)
        elif sort == "category":
            filtered.sort(key=lambda x: x["category"].lower(), reverse=reverse)

    return jsonify({"success": True, "expenses": filtered})

@expensetracker_bp.route('/api', methods=['POST'])
def add_expense():
    expenses = session.get('expenses', [])

    data = request.json or {}
    item = data.get("item")
    amount = data.get("amount")
    category = data.get("category")
    date_str = data.get("date")

    if not item or not category or not date_str or not isinstance(amount, (int, float)):
        return jsonify({"success": False, "error": "Invalid input"})

    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify({"success": False, "error": "Invalid date format"})

    new_expense = {
        "id": expenses[-1]['id'] + 1 if expenses else 1,
        "item": item,
        "amount": amount,
        "category": category,
        "date": date_str
    }

    expenses.append(new_expense)
    session['expenses'] = expenses
    session.modified = True

    return jsonify({"success": True, "expense": new_expense})


@expensetracker_bp.route('/api/<int:id>', methods=['GET', 'PUT', 'DELETE'])
def expense_by_id(id):
    for exp in session.get('expenses', []):
        if exp['id'] == id:
            if request.method == 'GET':
                return jsonify({"success": True, "expense": exp})
            elif request.method == 'PUT':
                data = request.json
                exp['item'] = data.get('item', exp['item'])
                exp['amount'] = data.get('amount', exp['amount'])
                exp['category'] = data.get('category', exp['category'])
                date_str = data.get('date')
                if date_str:
                    try:
                        datetime.strptime(date_str, "%Y-%m-%d")
                        exp['date'] = date_str
                    except ValueError:
                        return jsonify({"success": False, "error": "Invalid date"})
                return jsonify({"success": True, "expense": exp})
            else:
                session['expenses'].remove(exp)
                session.modified = True
                return jsonify({"success": True, "message": "Deleted"})
    return jsonify({"success": False, "error": "Expense not found"})
