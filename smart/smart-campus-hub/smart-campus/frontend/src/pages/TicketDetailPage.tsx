import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, commentApi } from '@/lib/api';
import type { Ticket, Comment } from '@/lib/types';
import {
  ArrowLeft, AlertTriangle, Activity, MessageSquare, Send, Edit2,
  Trash2, Clock, User, MapPin
} from 'lucide-react';

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      Promise.all([
        ticketApi.getById(id),
        commentApi.getByTicket(id),
      ]).then(([ticketRes, commentsRes]) => {
        setTicket(ticketRes.data);
        setComments(commentsRes.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    setSending(true);
    try {
      await commentApi.create(id, newComment);
      const res = await commentApi.getByTicket(id);
      setComments(res.data);
      setNewComment('');
    } catch {
      alert('Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await commentApi.update(commentId, editContent);
      const res = await commentApi.getByTicket(id!);
      setComments(res.data);
      setEditingComment(null);
      setEditContent('');
    } catch {
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentApi.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch {
      alert('Failed to delete comment');
    }
  };

  if (loading || !ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-slate-50 text-slate-600 border-slate-200',
  };

  const statusColors: Record<string, string> = {
    OPEN: 'bg-blue-50 text-blue-700 border-blue-200',
    IN_PROGRESS: 'bg-amber-50 text-amber-700 border-amber-200',
    RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-slate-100 text-slate-600 border-slate-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Tickets
      </button>

      {/* Ticket Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'bg-rose-100' : 'bg-amber-100'
          }`}>
            {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ?
              <AlertTriangle className="w-6 h-6 text-rose-600" /> :
              <Activity className="w-6 h-6 text-amber-600" />
            }
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${priorityColors[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusColors[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full">{ticket.category}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="w-4 h-4" /> {ticket.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4" /> Reported by {ticket.reportedByName}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" /> {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
            {ticket.assignedToName && (
              <div className="flex items-center gap-2 text-sm text-violet-600">
                <User className="w-4 h-4" /> Assigned to {ticket.assignedToName}
              </div>
            )}
          </div>

          {ticket.resolutionNotes && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mt-4">
              <h3 className="text-sm font-semibold text-emerald-800 mb-1">Resolution Notes</h3>
              <p className="text-sm text-emerald-700">{ticket.resolutionNotes}</p>
            </div>
          )}

          {ticket.rejectionReason && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mt-4">
              <h3 className="text-sm font-semibold text-rose-800 mb-1">Rejection Reason</h3>
              <p className="text-sm text-rose-700">{ticket.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-violet-600" />
          Comments ({comments.length})
        </h2>

        {/* Add Comment */}
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <button onClick={handleAddComment} disabled={!newComment.trim() || sending}
              className="px-4 py-2.5 gradient-primary text-white rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                comment.authorRole === 'ADMIN' ? 'bg-violet-600' :
                comment.authorRole === 'TECHNICIAN' ? 'bg-amber-600' : 'bg-blue-600'
              }`}>
                {comment.authorName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900">{comment.authorName}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    comment.authorRole === 'ADMIN' ? 'bg-violet-50 text-violet-600' :
                    comment.authorRole === 'TECHNICIAN' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  }`}>{comment.authorRole}</span>
                  <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                  {comment.edited && <span className="text-xs text-slate-400">(edited)</span>}
                </div>

                {editingComment === comment.id ? (
                  <div className="flex gap-2">
                    <input type="text" value={editContent} onChange={e => setEditContent(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                    <button onClick={() => handleEditComment(comment.id)}
                      className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg">Save</button>
                    <button onClick={() => setEditingComment(null)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600">{comment.content}</p>
                )}

                {comment.authorId === user?.id && editingComment !== comment.id && (
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => { setEditingComment(comment.id); setEditContent(comment.content); }}
                      className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                )}
                {isAdmin && comment.authorId !== user?.id && (
                  <button onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 mt-1">
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-sm text-slate-400 py-4">No comments yet. Be the first to comment.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
