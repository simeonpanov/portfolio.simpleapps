from flask import Blueprint, render_template, request, jsonify, session
from datetime import datetime

todo_bp = Blueprint(
    "todo",
    __name__,
    template_folder="templates",
    static_folder="static",
    static_url_path="/todo/static",
)

PRIORITY_ORDER = ["High", "Medium", "Low"]
CATEGORIES = ["Work", "Personal", "Urgent"]


def get_tasks():
    if "tasks" not in session:
        session["tasks"] = []
    return session["tasks"]


@todo_bp.route("/")
def index():
    return render_template("todo_index.html")


@todo_bp.route("/api/tasks")
def api_tasks():
    tasks = get_tasks()

    # Ensure every task has all expected fields
    for task in tasks:
        task.setdefault("description", "")
        task.setdefault("completed", False)

    search_query = request.args.get("search", "").strip()
    sort_option = request.args.get("sort", "")

    if search_query:
        tasks = [t for t in tasks if search_query.lower() in t["note"].lower()]

    # Sorting
    if sort_option == "az":
        tasks = sorted(tasks, key=lambda x: x["note"])
    elif sort_option == "za":
        tasks = sorted(tasks, key=lambda x: x["note"], reverse=True)
    elif sort_option == "priority":
        tasks = sorted(tasks, key=lambda x: PRIORITY_ORDER.index(x["priority"]))
    elif sort_option == "date":
        tasks = sorted(tasks, key=lambda x: x["duedate"], reverse=True)

    return jsonify(tasks)


@todo_bp.route("/api/add", methods=["POST"])
def api_add():
    data = request.json
    note = data.get("note", "").strip()
    duedate_raw = data.get("duedate", "").strip()
    priority = data.get("priority", "")
    category = data.get("category", "")

    if (
        not note
        or not duedate_raw
        or priority not in PRIORITY_ORDER
        or category not in CATEGORIES
    ):
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    for fmt in ("%d-%m-%Y %H:%M", "%Y-%m-%d %H:%M", "%d-%m-%Y", "%Y-%m-%d"):
        try:
            duedate_dt = datetime.strptime(duedate_raw, fmt)
            break
        except ValueError:
            continue
    else:
        return jsonify({"status": "error", "message": "Invalid date"}), 400

    duedate = duedate_dt.strftime("%Y-%m-%d %H:%M")

    tasks = get_tasks()
    task_id = max([t["id"] for t in tasks], default=0) + 1
    tasks.append(
        {
            "id": task_id,
            "note": note,
            "duedate": duedate,
            "priority": priority,
            "category": category,
            "description": "",  # ✅ Add description
            "completed": False,  # ✅ Add completed status
        }
    )
    session["tasks"] = tasks

    return jsonify({"status": "success"})


@todo_bp.route("/api/remove/<int:task_id>", methods=["DELETE"])
def api_remove(task_id):
    tasks = get_tasks()
    tasks = [t for t in tasks if t["id"] != task_id]
    session["tasks"] = tasks
    return jsonify({"status": "success"})


@todo_bp.route("/api/update/<int:task_id>", methods=["PATCH"])
def api_update(task_id):
    data = request.json
    new_description = data.get("description", "").strip()

    tasks = get_tasks()
    for task in tasks:
        if task["id"] == task_id:
            task["description"] = new_description
            session["tasks"] = tasks
            return jsonify({"status": "success"})

    return jsonify({"status": "error", "message": "Task not found"}), 404


@todo_bp.route("/api/complete/<int:task_id>", methods=["PATCH"])
def api_complete(task_id):
    data = request.json
    completed = data.get("completed", False)  # expect boolean

    tasks = get_tasks()
    for task in tasks:
        if task["id"] == task_id:
            # Ensure all existing tasks have 'completed' field
            task.setdefault("completed", False)
            task.setdefault("description", "")
            task["completed"] = bool(completed)
            session["tasks"] = tasks
            return jsonify({"status": "success"})

    return jsonify({"status": "error", "message": "Task not found"}), 404
