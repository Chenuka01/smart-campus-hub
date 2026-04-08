import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, commentApi, API_BASE_URL } from '@/lib/api';
import type { Ticket, Comment } from '@/lib/types';
import { ArrowLeft, AlertTriangle, Activity, MessageSquare, Send, Edit2, Trash2, Clock, User, MapPin, Mail, Phone } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { containerVariants, itemVariants, scrollRevealVariants } from '@/lib/animations';
import { getTicketSlaSummary } from '@/lib/ticketSla';

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
  const [editingTicket, setEditingTicket] = useState(false);
  const [editTicketData, setEditTicketData] = useState<Partial<Ticket>>({});

  useEffect(() => {
    if (id) {
      Promise.all([ticketApi.getById(id), commentApi.getByTicket(id)]).then(([tr, cr]) => {
        setTicket(tr.data); setComments(cr.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  const handleEditTicket = async () => {
    if (!id || !editTicketData) return;
    try {
      await ticketApi.update(id, editTicketData);
      const res = await ticketApi.getById(id);
      setTicket(res.data);
      setEditingTicket(false);
    } catch { alert('Failed to update ticket'); }
  };

  const handleDeleteTicket = async () => {
    if (!id || !confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await ticketApi.delete(id);
      navigate('/tickets');
    } catch { alert('Failed to delete ticket'); }
  };

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
  const sla = getTicketSlaSummary(ticket);

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
                <span
                  className="px-3 py-1 text-xs font-semibold rounded-full"
                  style={{
                    background:
                      sla.tone === 'bad' ? 'rgba(244,63,94,0.12)' :
                      sla.tone === 'good' ? 'rgba(16,185,129,0.12)' :
                      sla.tone === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.06)',
                    border:
                      sla.tone === 'bad' ? '1px solid rgba(244,63,94,0.25)' :
                      sla.tone === 'good' ? '1px solid rgba(16,185,129,0.25)' :
                      sla.tone === 'warning' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    color:
                      sla.tone === 'bad' ? '#fb7185' :
                      sla.tone === 'good' ? '#6ee7b7' :
                      sla.tone === 'warning' ? '#fcd34d' : '#94a3b8',
                  }}
                >
                  SLA: {sla.label}
                </span>
              </div>
            </div>
            {/* Ticket Management Buttons */}
            {(ticket.reportedBy === user?.id || isAdmin) && (
              <div className="flex gap-2">
                {ticket.status === 'OPEN' && (
                  <button
                    onClick={() => { setEditingTicket(true); setEditTicketData(ticket); }}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-sm"
                    title="Edit Ticket"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {(ticket.status === 'OPEN' || isAdmin) && (
                  <button
                    onClick={handleDeleteTicket}
                    className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 transition-all shadow-sm"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {editingTicket ? (
            <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Title</label>
                  <input
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.title}
                    onChange={e => setEditTicketData({ ...editTicketData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.category}
                    onChange={e => setEditTicketData({ ...editTicketData, category: e.target.value })}
                  >
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="IT_SUPPORT">IT Support</option>
                    <option value="CLEANING">Cleaning</option>
                    <option value="SECURITY">Security</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Priority</label>
                  <select
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.priority}
                    onChange={e => setEditTicketData({ ...editTicketData, priority: e.target.value })}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Location / Resource</label>
                  <input
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.location}
                    onChange={e => setEditTicketData({ ...editTicketData, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Email</label>
                  <input
                    type="email"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.contactEmail}
                    onChange={e => setEditTicketData({ ...editTicketData, contactEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Phone</label>
                  <input
                    type="tel"
                    className="glass-input w-full px-3 py-2 rounded-lg text-sm"
                    value={editTicketData.contactPhone || ''}
                    onChange={e => setEditTicketData({ ...editTicketData, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  className="glass-input w-full px-3 py-2 rounded-lg text-sm h-24"
                  value={editTicketData.description}
                  onChange={e => setEditTicketData({ ...editTicketData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <NeuButton size="sm" variant="ghost" onClick={() => setEditingTicket(false)}>Cancel</NeuButton>
                <NeuButton size="sm" variant="primary" onClick={handleEditTicket}>Save Changes</NeuButton>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Resolution Timer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">SLA Target</p>
                    <p className="text-sm text-white">{ticket.slaTargetMinutes ? `${Math.round(ticket.slaTargetMinutes / 60)} hours` : 'Not set'}</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Due By</p>
                    <p className="text-sm text-white">{ticket.slaDueAt ? new Date(ticket.slaDueAt).toLocaleString() : 'Not set'}</p>
                  </div>
                  <div className="rounded-2xl p-4 bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Current SLA State</p>
                    <p className={
                      sla.tone === 'bad' ? 'text-sm text-rose-400' :
                      sla.tone === 'good' ? 'text-sm text-emerald-400' :
                      sla.tone === 'warning' ? 'text-sm text-amber-400' : 'text-sm text-slate-300'
                    }>
                      {sla.label}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Description</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {/* Evidence Attachments */}
              {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>📎</span> Evidence Photos ({ticket.attachmentUrls.length})
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {ticket.attachmentUrls.map((url: string, i: number) => (
                      <motion.a
                        key={i}
                        href={`${API_BASE_URL}${url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.04 }}
                        className="relative rounded-xl overflow-hidden block group"
                        style={{ aspectRatio: '1', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
                      >
                        <img
                          src={`${API_BASE_URL}${url}`}
                          alt={`Attachment ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).parentElement!.style.background = 'rgba(255,255,255,0.05)'; }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold transition-opacity">Open</span>
                        </div>
                      </motion.a>
                    ))}
                  </div>
                </div>
              )}

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
                {ticket.contactEmail && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    {ticket.contactEmail}
                  </div>
                )}
                {ticket.contactPhone && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    {ticket.contactPhone}
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
          )}
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
