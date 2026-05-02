import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, CheckCircle2, Circle, Clock, MoreVertical, Trash2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import useAuthStore from '../../context/useAuthStore';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
  const [memberEmail, setMemberEmail] = useState('');

  const isAdmin = project?.admin_id === user?.id;

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projData, tasksData] = await Promise.all([
        projectService.getProject(id),
        taskService.getProjectTasks(id)
      ]);
      setProject(projData);
      setTasks(tasksData);
    } catch (error) {
      toast.error('Failed to fetch project details');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.createTask(id, newTask);
      toast.success('Task created!');
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, currentStatus) => {
    const nextStatusMap = {
      'To Do': 'In Progress',
      'In Progress': 'Done',
      'Done': 'To Do'
    };
    try {
      await taskService.updateTaskStatus(taskId, nextStatusMap[currentStatus]);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(taskId);
      toast.success('Task deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await projectService.addMember(id, memberEmail);
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchData();
    } catch (error) {
      toast.error('User not found or already in project');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowMemberModal(true)}
              className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-xl font-bold transition-all"
            >
              <UserPlus size={20} />
              <span>Add Member</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={20} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Task Columns */}
        {['To Do', 'In Progress', 'Done'].map(status => (
          <div key={status} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'To Do' ? 'bg-slate-400' : 
                  status === 'In Progress' ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                {status}
                <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full ml-1">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </h3>
            </div>
            
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <div 
                  key={task.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                      task.priority === 'High' ? 'bg-red-100 text-red-600' :
                      task.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority}
                    </span>
                    {isAdmin && (
                      <button 
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{task.title}</h4>
                  <p className="text-sm text-slate-500 mb-4">{task.description}</p>
                  
                  {task.assigned_to_email && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                        {(task.assigned_to_name || task.assigned_to_email)[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-slate-600 font-medium truncate">
                        {task.assigned_to_name || task.assigned_to_email}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock size={14} />
                      <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <button
                      onClick={() => handleUpdateStatus(task.id, task.status)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        status === 'Done' ? 'text-green-500 bg-green-50' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {status === 'Done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Priority</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Assign To</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTask.assigned_to}
                  onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email} {member.id === user.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Add Team Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Member Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2 border border-slate-300 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-slate-900 text-white rounded-lg font-bold">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
