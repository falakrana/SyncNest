import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, UserPlus, UserMinus, Clock, Trash2, Pencil } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';
import { tenantService } from '../../services/tenantService';
import useAuthStore from '../../context/useAuthStore';
import toast from 'react-hot-toast';

const ProjectDetails = () => {
  const today = new Date().toISOString().slice(0, 10);
  const { id } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [selectedTaskByStatus, setSelectedTaskByStatus] = useState({});
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'Medium', due_date: today, assigned_to: '' });
  const [editingTask, setEditingTask] = useState({ id: null, title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const statusOptions = ['To Do', 'In Progress', 'In Testing', 'Done'];
  const members = project?.members || [];
  const memberCount = members.length;
  const displayedMembers = members;
  const remainingMembersCount = Math.max(memberCount - displayedMembers.length, 0);
  const normalizedMemberEmail = memberEmail.trim().toLowerCase();
  const existingMember = members.find(
    (member) => member.email?.toLowerCase() === normalizedMemberEmail
  );
  const isDuplicateMemberEmail = Boolean(normalizedMemberEmail && existingMember);

  const isAdmin = project?.admin_id === user?.id;

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskByStatus({});
      return;
    }

    setSelectedTaskByStatus((prev) => {
      const next = {};

      statusOptions.forEach((status) => {
        const statusTasks = tasks.filter((t) => t.status === status);
        if (!statusTasks.length) return;

        const prevSelectedId = prev[status];
        const stillExists = statusTasks.some((t) => String(t.id) === String(prevSelectedId));
        next[status] = stillExists ? prevSelectedId : statusTasks[0].id;
      });

      return next;
    });
  }, [tasks]);

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
      setNewTask({ title: '', description: '', priority: 'Medium', due_date: today, assigned_to: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateStatus = async (taskId, nextStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, nextStatus);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete.id);
      toast.success('Task deleted');
      setShowDeleteTaskModal(false);
      setTaskToDelete(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const openDeleteTaskModal = (task) => {
    setTaskToDelete(task);
    setShowDeleteTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'Medium',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
      assigned_to: task.assigned_to || ''
    });
    setShowEditTaskModal(true);
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    try {
      await taskService.updateTask(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
        due_date: editingTask.due_date,
        assigned_to: editingTask.assigned_to
      });
      toast.success('Task updated!');
      setShowEditTaskModal(false);
      setEditingTask({ id: null, title: '', description: '', priority: 'Medium', due_date: '', assigned_to: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (isDuplicateMemberEmail) {
      toast.error('User is already in this project');
      return;
    }

    try {
      await projectService.addMember(id, memberEmail.trim());
      toast.success('Member added!');
      setMemberEmail('');
      setShowMemberModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to add member');
    }
  };

  const handleCreateInvite = async () => {
    try {
      const data = await tenantService.createInvite(memberEmail.trim());
      setInviteToken(data.token);
      toast.success('Invite token created. Share this token with teammate.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invite');
    }
  };

  const handleRemoveMember = async () => {
    if (!isAdmin || !memberToRemove?.id || memberToRemove.id === user?.id) return;
    setRemovingMemberId(memberToRemove.id);
    try {
      await projectService.removeMember(id, memberToRemove.id);
      toast.success('Member removed');
      setMemberToRemove(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to remove member');
    } finally {
      setRemovingMemberId(null);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50 px-4 py-5 md:px-6 md:py-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{project.name}</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">{project.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">Members ({memberCount})</span>
            {displayedMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1"
                title={member.email}
              >
                <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                  {(member.name || member.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-xs text-slate-700 font-medium max-w-28 truncate">
                  {member.name || member.email}
                </span>
                {isAdmin && member.id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    disabled={removingMemberId === member.id}
                    className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    aria-label={`Remove ${member.name || member.email}`}
                    title="Remove member"
                  >
                    <UserMinus size={14} />
                  </button>
                )}
              </div>
            ))}
            {remainingMembersCount > 0 && (
              <span className="text-xs font-semibold rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-slate-600">
                +{remainingMembersCount} more
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Task Columns */}
        {statusOptions.map(status => (
          <div key={status} className="space-y-4 rounded-2xl border border-slate-200 bg-white/80 p-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  status === 'To Do' ? 'bg-slate-400' : 
                  status === 'In Progress' ? 'bg-blue-500' :
                  status === 'In Testing' ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                {status}
                <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full ml-1">
                  {tasks.filter(t => t.status === status).length}
                </span>
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {(() => {
                const statusTasks = tasks.filter(t => t.status === status);
                const selectedId = selectedTaskByStatus[status];
                const selectedTask = statusTasks.find((t) => String(t.id) === String(selectedId)) || statusTasks[0];

                if (!selectedTask) return null;

                return (
                  <>
                    <div 
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                          selectedTask.priority === 'High' ? 'bg-red-100 text-red-600' :
                          selectedTask.priority === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {selectedTask.priority}
                        </span>
                        {isAdmin && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleOpenEditTask(selectedTask)}
                              className="text-slate-300 hover:text-blue-600 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteTaskModal(selectedTask)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 mb-1">{selectedTask.title}</h4>
                      <p className="text-sm text-slate-500 mb-4">{selectedTask.description}</p>

                      {selectedTask.assigned_to_email && (
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
                            {(selectedTask.assigned_to_name || selectedTask.assigned_to_email)[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-600 font-medium truncate">
                            {selectedTask.assigned_to_name || selectedTask.assigned_to_email}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock size={14} />
                          <span>{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No date'}</span>
                        </div>
                        <select
                          className="text-xs border border-slate-300 rounded-md px-2 py-1 bg-white text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedTask.status}
                          onChange={(e) => handleUpdateStatus(selectedTask.id, e.target.value)}
                        >
                          {statusOptions.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {statusTasks.length > 1 && (
                      <select
                        className="w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                        value={String(selectedTask.id)}
                        onChange={(e) =>
                          setSelectedTaskByStatus((prev) => ({
                            ...prev,
                            [status]: e.target.value
                          }))
                        }
                      >
                        {statusTasks.map((taskItem) => (
                          <option key={taskItem.id} value={String(taskItem.id)}>
                            {taskItem.title || 'Untitled task'}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Create New Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  placeholder="Enter task description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {memberToRemove && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Remove Member</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to remove
              {' '}
              <span className="font-semibold text-slate-900">
                {memberToRemove.name || memberToRemove.email}
              </span>
              {' '}
              from this project?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemoveMember}
                disabled={removingMemberId === memberToRemove.id}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {removingMemberId === memberToRemove.id ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Edit Task</h2>
            <form onSubmit={handleEditTask} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 h-20"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Priority</label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
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
                    value={editingTask.due_date}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Assign To</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
                  value={editingTask.assigned_to}
                  onChange={(e) => setEditingTask({ ...editingTask, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {project.members.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email} {member.id === user.id ? '(You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
                <button type="button" onClick={() => setShowEditTaskModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold">Update Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6">Add Team Member</h2>
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
                {isDuplicateMemberEmail && (
                  <p className="mt-2 text-xs text-amber-600">
                    Already enrolled: {existingMember.name || existingMember.email}
                  </p>
                )}
                {inviteToken && (
                  <p className="mt-2 text-xs text-emerald-700 break-all">
                    Invite token: {inviteToken}
                  </p>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2 sm:pt-4">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold">Cancel</button>
                <button
                  type="button"
                  onClick={handleCreateInvite}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-bold"
                >
                  Create Invite Token
                </button>
                <button
                  type="submit"
                  disabled={isDuplicateMemberEmail}
                  className="flex-1 py-2.5 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Task Modal */}
      {showDeleteTaskModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl p-5 sm:p-8 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Delete Task</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete
              {' '}
              <span className="font-semibold text-slate-900">
                {taskToDelete?.title || 'this task'}
              </span>
              ?
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteTaskModal(false);
                  setTaskToDelete(null);
                }}
                className="flex-1 py-2.5 border border-slate-300 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTask}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
