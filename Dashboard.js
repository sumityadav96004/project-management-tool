import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });

  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: '#667eea',
    deadline: '',
    budget: '',
    members: []
  });
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
    fetchNotifications();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data);
      // Calculate stats
      const totalProjects = res.data.length;
      const activeTasks = res.data.reduce((acc, project) => acc + (project.tasks ? project.tasks.filter(task => task.status !== 'done').length : 0), 0);
      const completedTasks = res.data.reduce((acc, project) => acc + (project.tasks ? project.tasks.filter(task => task.status === 'done').length : 0), 0);
      const overdueTasks = res.data.reduce((acc, project) => {
        if (project.tasks) {
          return acc + project.tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done').length;
        }
        return acc;
      }, 0);
      setStats({ totalProjects, activeTasks, completedTasks, overdueTasks });
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/projects', newProject, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewProject({ name: '', description: '', color: '#667eea', deadline: '', budget: '', members: [] });
      setShowCreateForm(false);
      fetchProjects();
    } catch (error) {
      alert('Error creating project');
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <div className="user-info">
            <span>Welcome back!</span>
          </div>
        </div>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>
          <button
            className="btn notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          <button className="create-project-btn" onClick={() => setShowCreateForm(true)}>
            + New Project
          </button>
          <button className="btn logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalProjects}</h3>
          <p>Total Projects</p>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card">
          <h3>{stats.activeTasks}</h3>
          <p>Active Tasks</p>
          <div className="stat-icon">⚡</div>
        </div>
        <div className="stat-card">
          <h3>{stats.completedTasks}</h3>
          <p>Completed Tasks</p>
          <div className="stat-icon">✅</div>
        </div>
        <div className="stat-card">
          <h3>{stats.overdueTasks}</h3>
          <p>Overdue Tasks</p>
          <div className="stat-icon">⏰</div>
        </div>
      </div>

      {showNotifications && (
        <div className="notifications-panel" style={{ position: 'absolute', top: '60px', right: '20px', background: 'white', border: '1px solid #ddd', borderRadius: '5px', padding: '10px', width: '300px', zIndex: 1000 }}>
          <h3>Notifications</h3>
          {notifications.length === 0 ? (
            <p>No notifications</p>
          ) : (
            notifications.map(notification => (
              <div key={notification._id} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                {!notification.read && (
                  <button onClick={() => markNotificationAsRead(notification._id)} style={{ marginLeft: '10px', fontSize: '12px' }}>
                    Mark as read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {showCreateForm && (
        <div className="auth-container" style={{ margin: '20px 0' }}>
          <h2>Create New Project</h2>
          <form onSubmit={handleCreateProject}>
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Color</label>
              <input
                type="color"
                value={newProject.color}
                onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Deadline</label>
              <input
                type="date"
                value={newProject.deadline}
                onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Budget ($)</label>
              <input
                type="number"
                value={newProject.budget}
                onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
              />
            </div>
            <button type="submit" className="btn">Create</button>
            <button type="button" className="btn" onClick={() => setShowCreateForm(false)} style={{ marginLeft: '10px', background: '#6c757d' }}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="projects-grid">
        {filteredProjects.map(project => (
          <div key={project._id} className="project-card-wrapper">
            <Link to={`/project/${project._id}`} className="project-card" style={{ borderLeft: `5px solid ${project.color}` }}>
              <div className="project-header">
                <h3>{project.name}</h3>
                <span className={`status-badge status-${project.status}`}>{project.status}</span>
              </div>
              <p>{project.description}</p>
              <div className="project-meta">
                {project.deadline && (
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {project.budget && (
                  <div className="meta-item">
                    <span className="meta-icon">💰</span>
                    <span>${project.budget}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-icon">📋</span>
                  <span>{project.tasks ? project.tasks.length : 0} tasks</span>
                </div>
              </div>
              {project.progress > 0 && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                  <span className="progress-text">{project.progress}%</span>
                </div>
              )}
            </Link>
            <div className="project-actions">
              <button className="action-btn edit-btn" title="Edit">✏️</button>
              <button className="action-btn delete-btn" title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
