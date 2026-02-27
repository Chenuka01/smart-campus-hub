import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, commentApi } from '@/lib/api';
import type { Ticket, Comment } from '@/lib/types';
import { ArrowLeft, AlertTriangle, Activity, MessageSquare, Send, Edit2, Trash2, Clock, User, MapPin } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, scrollRevealVariants } from '@/lib/animations';

const priorityCfg: Record<string, { color: string; glow: string; glassColor: string }> = {
  CRITICAL: { color: 'text-rose-300', glow: 'rgba(244,63,94,0.4)', glassColor: 'rgba(244,63,94,0.12)' },
  HIGH: { color: 'text-orange-300', glow: 'rgba(249,115,22,0.35)', glassColor: 'rgba(249,115,22,0.1)' },
  MEDIUM: { color: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.1)' },
  LOW: { color: 'text-slate-400', glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.06)' },
};

const statusCfg: Record<string, { color: string; glow: string; glassColor: string }> = {
  OPEN: { color: 'text-blue-300', glow: 'rgba(59,130,246,0.3)', glassColor: 'rgba(59,130,246,0.12)' },
  IN_PROGRESS: { color: 'text-amber-300', glow: 'rgba(245,158,11,0.3)', glassColor: 'rgba(245,158,11,0.12)' },
  RESOLVED: { color: 'text-emerald-300', glow: 'rgba(16,185,129,0.3)', glassColor: 'rgba(16,185,129,0.12)' },
  CLOSED: { color: 'text-slate-400', glow: 'rgba(148,163,184,0.2)', glassColor: 'rgba(148,163,184,0.08)' },
  REJECTED: { color: 'text-rose-300', glow: 'rgba(244,63,94,0.3)', glassColor: 'rgba(244,63,94,0.12)' },
};

const roleColors: Record<string, { bg: string; border: string; text: string }> = {
  ADMIN: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.25)', text: '#a78bfa' },
  TECHNICIAN: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.25)', text: '#fbbf24' },
  USER: { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.25)', text: '#60a5fa' },
};

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
      Promise.all([ticketApi.getById(id), commentApi.getByTicket(id)]).then(([tr, cr]) => {
        setTicket(tr.data); setComments(cr.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    setSending(true);
    try {
      await commentApi.create(id, newComment);
      const res = await commentApi.getByTicket(id);
      setComments(res.data); setNewComment('');
    } catch { alert('Failed to add comment'); } finally { setSending(false); }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await commentApi.update(commentId, editContent);
      const res = await commentApi.getByTicket(id!);
      setComments(res.data); setEditingComment(null); setEditContent('');
    } catch { alert('Failed to edit comment'); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentApi.delete(commentId);
      setComments(comments.filter(c => c.id !== commentId));
    } catch { alert('Failed to delete comment'); }
  };

  if (loading || !ticket) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  const pc = priorityCfg[ticket.priority] || priorityCfg.LOW;
  const sc = statusCfg[ticket.status] || statusCfg.OPEN;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto pb-8 space-y-5">
      <motion.div variants={itemVariants}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Tickets
        </button>
      </motion.div>

      {/* Ticket Details */}
      <motion.div variants={itemVariants}>
        <LiquidGlassCard depth={2} glow={pc.glow}>
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${ticket.priority === 'CRITICAL' ? 'animate-pulse-glow' : ''}`}
              style={{ background: pc.glassColor, border: `1px solid ${pc.glow}`, boxShadow: `0 0 16px ${pc.glow}` }}
            >
              {ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH'
                ? <AlertTriangle className={`w-6 h-6 ${pc.color}`} />
                : <Activity className={`w-6 h-6 ${pc.color}`} />
              }
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{ticket.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: pc.glassColor, border: `1px solid ${pc.glow}`, color: 'white' }}>
                  {ticket.priority}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: sc.glassColor, border: `1px solid ${sc.glow}`, color: 'white' }}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full text-slate-400" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {ticket.category}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                {ticket.location}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <User className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                Reported by {ticket.reportedByName}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
              {ticket.assignedToName && (
                <div className="flex items-center gap-2 text-sm text-violet-400 font-semibold">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  Assigned to {ticket.assignedToName}
                </div>
              )}
            </div>

            {ticket.resolutionNotes && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Resolution Notes</h3>
                <p className="text-sm text-emerald-300">{ticket.resolutionNotes}</p>
              </div>
            )}
            {ticket.rejectionReason && (
              <div className="p-4 rounded-xl" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
                <h3 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Rejection Reason</h3>
                <p className="text-sm text-rose-300">{ticket.rejectionReason}</p>
              </div>
            )}
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* Comments Section */}
      <motion.div variants={itemVariants}>
        <LiquidGlassCard depth={2}>
          <h2 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-violet-400" />
            Comments
            <span className="text-slate-500 text-sm font-normal ml-1">({comments.length})</span>
          </h2>

          {/* Add comment */}
          <div className="flex gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ boxShadow: '0 0 10px rgba(139,92,246,0.3)' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                placeholder="Write a comment…"
                className="glass-input flex-1 px-4 py-2.5 rounded-xl text-sm"
              />
              <NeuButton onClick={handleAddComment} disabled={!newComment.trim() || sending} loading={sending} variant="primary" size="sm" icon={<Send className="w-4 h-4" />} iconPosition="left">
                Post
              </NeuButton>
            </div>
          </div>

          {/* Comments list */}
          <div className="space-y-4">
            {comments.map((comment, i) => {
              const rc = roleColors[comment.authorRole] || roleColors.USER;
              return (
                <motion.div key={comment.id} custom={i} variants={scrollRevealVariants} initial="hidden" animate="visible" className="flex gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}
                  >
                    {comment.authorName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm font-bold text-white">{comment.authorName}</span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>
                        {comment.authorRole}
                      </span>
                      <span className="text-xs text-slate-600">{new Date(comment.createdAt).toLocaleString()}</span>
                      {comment.edited && <span className="text-xs text-slate-600">(edited)</span>}
                    </div>

                    {editingComment === comment.id ? (
                      <div className="flex gap-2">
                        <input type="text" value={editContent} onChange={e => setEditContent(e.target.value)}
                          className="glass-input flex-1 px-3 py-2 rounded-xl text-sm" />
                        <NeuButton size="sm" variant="primary" onClick={() => handleEditComment(comment.id)}>Save</NeuButton>
                        <NeuButton size="sm" variant="ghost" onClick={() => setEditingComment(null)}>Cancel</NeuButton>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-300 leading-relaxed">{comment.content}</p>
                    )}

                    {comment.authorId === user?.id && editingComment !== comment.id && (
                      <div className="flex gap-3 mt-1.5">
                        <button onClick={() => { setEditingComment(comment.id); setEditContent(comment.content); }}
                          className="text-xs text-slate-500 hover:text-violet-400 flex items-center gap-1 transition-colors">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                    {isAdmin && comment.authorId !== user?.id && (
                      <button onClick={() => handleDeleteComment(comment.id)}
                        className="text-xs text-slate-500 hover:text-rose-400 flex items-center gap-1 mt-1.5 transition-colors">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {comments.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No comments yet. Be the first to comment.</p>
              </div>
            )}
          </div>
        </LiquidGlassCard>
      </motion.div>
    </motion.div>
  );
}
