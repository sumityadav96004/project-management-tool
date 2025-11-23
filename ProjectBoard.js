import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const ProjectBoard = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    assignedTo: '',
    dueDate: '',
    tags: '',
    subtasks: ''
  });
  const [newComment, setNewComment] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchTasks();
    fetchUsers();

    socket.emit('joinProject', id);
    socket.on('taskUpdated', (updatedTask) => {
      setTasks(prev => prev.map(task => task._id === updatedTask._id ? updatedTask : task));
    });

    return () => {
      socket.off('taskUpdated');
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProject(res.data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/tasks/project/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a new endpoint to get all users
      // For now, we'll use a mock list
      setUsers([
        { _id: '1', username: 'John Doe' },
        { _id: '2', username: 'Jane Smith' },
        { _id: '3', username: 'Bob Johnson' }
      ]);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchComments = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/comments/task/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const taskData = {
        ...newTask,
        project: id,
        tags: newTask.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        subtasks: newTask.subtasks.split('\n').map(subtask => ({ title: subtask.trim(), completed: false })).filter(subtask => subtask.title)
      };
      const res = await axios.post('http://localhost:5000/api/tasks', taskData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks([...tasks, res.data]);
      setNewTask({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignedTo: '',
        dueDate: '',
        tags: '',
        subtasks: ''
      });
      setShowTaskForm(false);
      socket.emit('taskUpdate', res.data);
    } catch (error) {
      alert('Error creating task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5000/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(prev => prev.map(task => task._id === taskId ? res.data : task));
      socket.emit('taskUpdate', res.data);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleAddComment = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/comments', { text: newComment, task: taskId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewComment('');
      setShowCommentForm(null);
      fetchComments(taskId);
    } catch (error) {
      alert('Error adding comment');
    }
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    fetchComments(task._id);
  };

  const columns = ['todo', 'in-progress', 'done'];

  return (
    <div className="board">
      <div className="board-header">
        <Link to="/dashboard">← Back to Dashboard</Link>
        <h1>{project?.name}</h1>
        <button className="create-project-btn" onClick={() => setShowTaskForm(true)}>
          Add Task
        </button>
      </div>

      {showTaskForm && (
        <div className="auth-container" style={{ margin: '20px 0' }}>
          <h2>Add New Task</h2>
          <form onSubmit={handleCreateTask}>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Priority</label>
              <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Assign To</label>
              <select value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>{user.username}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tags (comma-separated)</label>
              <input
                type="text"
                value={newTask.tags}
                onChange={(e) => setNewTask({ ...newTask, tags: e.target.value })}
                placeholder="e.g., frontend, urgent, bug"
              />
            </div>
            <div className="form-group">
              <label>Subtasks (one per line)</label>
              <textarea
                value={newTask.subtasks}
                onChange={(e) => setNewTask({ ...newTask, subtasks: e.target.value })}
                rows="3"
                placeholder="Subtask 1&#10;Subtask 2&#10;Subtask 3"
              />
            </div>
            <button type="submit" className="btn">Create Task</button>
            <button type="button" className="btn" onClick={() => setShowTaskForm(false)} style={{ marginLeft: '10px', background: '#6c757d' }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="columns">
        {columns.map(column => (
          <div key={column} className="column">
            <h3>{column.replace('-', ' ').toUpperCase()}</h3>
            {tasks
              .filter(task => task.status === column)
              .map(task => (
                <div key={task._id} className="task-card" onClick={() => openTaskDetails(task)}>
                  <h4>{task.title}</h4>
                  <p>{task.description}</p>
                  {task.priority && <span className={`priority-${task.priority}`}>{task.priority}</span>}
                  {task.dueDate && <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>}
                  {task.tags && task.tags.length > 0 && (
                    <div className="tags">
                      {task.tags.map((tag, index) => (
                        <span key={index} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              ))}
          </div>
        ))}
      </div>

      {selectedTask && (
        <div className="task-details-modal" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '10px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h2>{selectedTask.title}</h2>
            <p>{selectedTask.description}</p>
            <div style={{ margin: '10px 0' }}>
              <strong>Priority:</strong> {selectedTask.priority}
            </div>
            {selectedTask.dueDate && (
              <div style={{ margin: '10px 0' }}>
                <strong>Due Date:</strong> {new Date(selectedTask.dueDate).toLocaleDateString()}
              </div>
            )}
            {selectedTask.tags && selectedTask.tags.length > 0 && (
              <div style={{ margin: '10px 0' }}>
                <strong>Tags:</strong> {selectedTask.tags.join(', ')}
              </div>
            )}
            {selectedTask.subtasks && selectedTask.subtasks.length > 0 && (
              <div style={{ margin: '10px 0' }}>
                <strong>Subtasks:</strong>
                <ul>
                  {selectedTask.subtasks.map((subtask, index) => (
                    <li key={index} style={{ textDecoration: subtask.completed ? 'line-through' : 'none' }}>
                      {subtask.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <h3>Comments</h3>
            {comments.map(comment => (
              <div key={comment._id} style={{ border: '1px solid #ddd', padding: '10px', margin: '5px 0', borderRadius: '5px' }}>
                <strong>{comment.author.username}:</strong> {comment.text}
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  {new Date(comment.createdAt).toLocaleString()}
                </small>
              </div>
            ))}
            {showCommentForm === selectedTask._id ? (
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                  style={{ width: '100%', margin: '10px 0' }}
                />
                <button onClick={() => handleAddComment(selectedTask._id)} className="btn">Add Comment</button>
                <button onClick={() => setShowCommentForm(null)} className="btn" style={{ marginLeft: '10px', background: '#6c757d' }}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowCommentForm(selectedTask._id)} className="btn">Add Comment</button>
            )}
            <button onClick={() => setSelectedTask(null)} className="btn" style={{ marginTop: '10px', background: '#dc3545' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBoard;
