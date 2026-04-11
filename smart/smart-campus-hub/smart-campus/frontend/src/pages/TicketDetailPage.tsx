import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { ticketApi, commentApi, API_BASE_URL } from '@/lib/api';
import type { Ticket, Comment } from '@/lib/types';
import { ArrowLeft, AlertTriangle, Activity, MessageSquare, Send, Edit2, Trash2, Clock, User, MapPin, Mail, Phone, Image, Upload, X, Eye, Pencil, RotateCcw, Save } from 'lucide-react';
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

type EditAttachmentItem = {
  id: string;
  name: string;
  previewUrl: string;
  existingUrl?: string;
  file?: File;
  revokeOnCleanup: boolean;
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const editAttachmentsRef = useRef<EditAttachmentItem[]>([]);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
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
  const [editAttachments, setEditAttachments] = useState<EditAttachmentItem[]>([]);
  const [previewModal, setPreviewModal] = useState<{ index: number; mode: 'preview' | 'annotate' } | null>(null);
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationPreview, setAnnotationPreview] = useState('');

  useEffect(() => {
    if (id) {
      Promise.all([ticketApi.getById(id), commentApi.getByTicket(id)]).then(([tr, cr]) => {
        setTicket(tr.data); setComments(cr.data);
      }).finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    editAttachmentsRef.current = editAttachments;
  }, [editAttachments]);

  useEffect(() => {
    return () => {
      editAttachmentsRef.current.forEach(item => {
        if (item.revokeOnCleanup) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!previewModal || previewModal.mode !== 'annotate') {
      setIsDrawing(false);
      return;
    }

    const image = modalImageRef.current;
    const canvas = annotationCanvasRef.current;
    if (!image || !canvas) {
      return;
    }

    const syncCanvas = () => {
      const rect = image.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineCap = 'round';
        context.lineJoin = 'round';
      }
      setAnnotationPreview(editAttachments[previewModal.index]?.previewUrl || '');
    };

    if (image.complete) {
      syncCanvas();
    } else {
      image.onload = syncCanvas;
    }

    window.addEventListener('resize', syncCanvas);
    return () => {
      window.removeEventListener('resize', syncCanvas);
      image.onload = null;
    };
  }, [previewModal, editAttachments]);

  const buildEditAttachments = (attachmentUrls: string[] = []): EditAttachmentItem[] =>
    attachmentUrls.map((url, index) => ({
      id: `existing-${index}-${url}`,
      name: `Evidence ${index + 1}`,
      previewUrl: `${API_BASE_URL}${url}`,
      existingUrl: url,
      revokeOnCleanup: false,
    }));

  const startEditingTicket = () => {
    if (!ticket) {
      return;
    }
    setEditTicketData(ticket);
    setEditAttachments(buildEditAttachments(ticket.attachmentUrls));
    setEditingTicket(true);
  };

  const stopEditingTicket = () => {
    editAttachments.forEach(item => {
      if (item.revokeOnCleanup) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setEditingTicket(false);
    setPreviewModal(null);
    setEditAttachments([]);
    setAnnotationPreview('');
    setIsDrawing(false);
  };

  const handleEditTicket = async () => {
    if (!id || !editTicketData) return;
    try {
      const ticketPayload = {
        ...editTicketData,
        retainedAttachmentUrls: editAttachments
          .filter(item => item.existingUrl && !item.file)
          .map(item => item.existingUrl),
      };

      const formData = new FormData();
      const ticketFile = new File(
        [JSON.stringify(ticketPayload)],
        'ticket.json',
        { type: 'application/json' }
      );
      formData.append('ticket', ticketFile);
      editAttachments
        .filter(item => item.file)
        .forEach((item, index) => {
          formData.append('files', item.file!, item.file?.name || `edited-evidence-${index + 1}.png`);
        });

      await ticketApi.updateWithFiles(id, formData);
      const res = await ticketApi.getById(id);
      setTicket(res.data);
      stopEditingTicket();
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

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 3 - editAttachments.length;
    const toAdd = files.slice(0, remaining).map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
      file,
      revokeOnCleanup: true,
    }));
    setEditAttachments(prev => [...prev, ...toAdd]);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  const removeEditAttachment = (index: number) => {
    setEditAttachments(prev => {
      const target = prev[index];
      if (target?.revokeOnCleanup) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
    if (previewModal?.index === index) {
      setPreviewModal(null);
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const refreshAnnotationPreview = () => {
    const image = modalImageRef.current;
    const annotationCanvas = annotationCanvasRef.current;
    const previewIndex = previewModal?.index;
    if (!image || !annotationCanvas || previewIndex == null) {
      return;
    }

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = image.naturalWidth || image.width;
    exportCanvas.height = image.naturalHeight || image.height;
    const exportContext = exportCanvas.getContext('2d');
    if (!exportContext || exportCanvas.width === 0 || exportCanvas.height === 0) {
      return;
    }

    exportContext.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
    exportContext.drawImage(annotationCanvas, 0, 0, exportCanvas.width, exportCanvas.height);
    try {
      setAnnotationPreview(exportCanvas.toDataURL(editAttachments[previewIndex]?.file?.type || 'image/png'));
    } catch {
      setAnnotationPreview(editAttachments[previewIndex]?.previewUrl || '');
    }
  };

  const loadImageElement = (source: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const nextImage = new window.Image();
    nextImage.onload = () => resolve(nextImage);
    nextImage.onerror = () => reject(new Error('Failed to load image for annotation export'));
    nextImage.src = source;
  });

  const getExportImageSource = async (item: EditAttachmentItem) => {
    if (item.file || !item.existingUrl) {
      return { source: item.previewUrl, revoke: false };
    }

    const response = await fetch(item.previewUrl, { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Failed to load existing evidence image');
    }

    const blob = await response.blob();
    return {
      source: URL.createObjectURL(blob),
      revoke: true,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = annotationCanvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsDrawing(true);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) {
      return;
    }
    const canvas = annotationCanvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) {
      return;
    }
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.strokeStyle = brushColor;
    context.lineWidth = brushSize;
    context.lineTo(point.x, point.y);
    context.stroke();
    refreshAnnotationPreview();
  };

  const stopDrawing = () => {
    if (!isDrawing) {
      return;
    }
    const context = annotationCanvasRef.current?.getContext('2d');
    context?.closePath();
    setIsDrawing(false);
    refreshAnnotationPreview();
  };

  const resetAnnotation = () => {
    const canvas = annotationCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (previewModal) {
      setAnnotationPreview(editAttachments[previewModal.index]?.previewUrl || '');
    }
  };

  const saveAnnotation = async () => {
    const previewIndex = previewModal?.index;
    const image = modalImageRef.current;
    const annotationCanvas = annotationCanvasRef.current;
    if (previewIndex == null || !image || !annotationCanvas) {
      return;
    }

    const currentItem = editAttachments[previewIndex];
    if (!currentItem) {
      return;
    }

    let tempSourceToRevoke: string | null = null;

    try {
      const { source, revoke } = await getExportImageSource(currentItem);
      tempSourceToRevoke = revoke ? source : null;
      const exportImage = await loadImageElement(source);

      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = exportImage.naturalWidth || image.naturalWidth || image.width;
      exportCanvas.height = exportImage.naturalHeight || image.naturalHeight || image.height;
      const exportContext = exportCanvas.getContext('2d');
      if (!exportContext || exportCanvas.width === 0 || exportCanvas.height === 0) {
        throw new Error('Failed to prepare annotation export');
      }

      exportContext.drawImage(exportImage, 0, 0, exportCanvas.width, exportCanvas.height);
      exportContext.drawImage(annotationCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

      exportCanvas.toBlob(blob => {
        if (!blob) {
          alert('Failed to save annotation');
          return;
        }
        const fileName = currentItem.name || `annotated-evidence-${previewIndex + 1}.png`;
        const fileType = blob.type || currentItem.file?.type || 'image/png';
        const nextFile = new File([blob], fileName, { type: fileType });
        const nextPreviewUrl = URL.createObjectURL(blob);

        setEditAttachments(prev => prev.map((item, index) => {
          if (index !== previewIndex) {
            return item;
          }
          if (item.revokeOnCleanup) {
            URL.revokeObjectURL(item.previewUrl);
          }
          return {
            ...item,
            previewUrl: nextPreviewUrl,
            file: nextFile,
            existingUrl: undefined,
            revokeOnCleanup: true,
          };
        }));
        setAnnotationPreview(nextPreviewUrl);
        setPreviewModal({ index: previewIndex, mode: 'preview' });
        setIsDrawing(false);
      }, currentItem.file?.type || 'image/png');
    } catch {
      alert('Failed to save annotation');
    } finally {
      if (tempSourceToRevoke) {
        URL.revokeObjectURL(tempSourceToRevoke);
      }
    }
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
                    onClick={startEditingTicket}
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Image className="w-3.5 h-3.5" />
                    Evidence Photos
                    <span className="text-slate-600">({editAttachments.length}/3)</span>
                  </label>
                  {editAttachments.length < 3 && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-violet-300 border border-violet-500/20 bg-violet-500/10"
                    >
                      <Upload className="w-3.5 h-3.5" /> Re-upload
                    </button>
                  )}
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleEditFileChange}
                  />
                </div>

                {editAttachments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {editAttachments.map((item, index) => (
                      <div
                        key={item.id}
                        className="relative rounded-xl overflow-hidden"
                        style={{ aspectRatio: '1', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute top-1.5 left-1.5 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ index, mode: 'preview' })}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ background: 'rgba(15,23,42,0.72)' }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewModal({ index, mode: 'annotate' })}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                            style={{ background: 'rgba(124,58,237,0.78)' }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEditAttachment(index)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ background: 'rgba(244,63,94,0.8)' }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] text-white font-semibold"
                          style={{ background: 'rgba(0,0,0,0.6)' }}>
                          {item.file ? 'Re-uploaded' : 'Existing'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="w-full py-6 rounded-2xl border border-dashed border-white/10 text-sm text-slate-500 hover:text-slate-300"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    Click to upload evidence photos
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <NeuButton size="sm" variant="ghost" onClick={stopEditingTicket}>Cancel</NeuButton>
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

      {previewModal && editAttachments[previewModal.index] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.82)' }}>
          <div
            className="w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10"
            style={{ background: 'rgba(15,23,42,0.96)', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {previewModal.mode === 'annotate' ? 'Annotate Evidence Photo' : 'Preview Evidence Photo'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{editAttachments[previewModal.index].name}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewModal.mode === 'annotate' && (
              <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Color
                  <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-white/10" />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  Brush
                  <input type="range" min="2" max="16" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} />
                  <span className="text-xs text-slate-400 w-6">{brushSize}</span>
                </label>
                <button type="button" onClick={resetAnnotation} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-200 border border-white/10" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button type="button" onClick={saveAnnotation} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white border border-emerald-400/20" style={{ background: 'rgba(16,185,129,0.18)' }}>
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            )}

            <div className="max-h-[75vh] overflow-auto p-5">
              <div className={`grid gap-5 ${previewModal.mode === 'annotate' ? 'lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]' : ''}`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">
                    {previewModal.mode === 'annotate' ? 'Annotate On Preview' : 'Image Preview'}
                  </p>
                  <div className="relative mx-auto w-fit max-w-full">
                    <img
                      ref={modalImageRef}
                      src={editAttachments[previewModal.index].previewUrl}
                      alt={editAttachments[previewModal.index].name}
                      className="block max-h-[68vh] max-w-full rounded-2xl"
                    />
                    {previewModal.mode === 'annotate' && (
                      <canvas
                        ref={annotationCanvasRef}
                        className="absolute inset-0 z-10 rounded-2xl touch-none cursor-crosshair"
                        onPointerDown={startDrawing}
                        onPointerMove={draw}
                        onPointerUp={stopDrawing}
                        onPointerLeave={stopDrawing}
                      />
                    )}
                  </div>
                </div>

                {previewModal.mode === 'annotate' && (
                  <div className="lg:min-w-[280px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Live Result Preview</p>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <img
                        src={annotationPreview || editAttachments[previewModal.index].previewUrl}
                        alt={`Annotated preview ${previewModal.index + 1}`}
                        className="block max-h-[52vh] w-full rounded-xl object-contain"
                      />
                    </div>
                    <p className="mt-3 text-xs text-slate-400">
                      Draw on the left image. The saved file will replace the current evidence photo in this ticket.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
