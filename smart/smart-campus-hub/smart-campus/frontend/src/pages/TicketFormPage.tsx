import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi, ticketApi, authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { Facility, User } from '@/lib/types';
import { ArrowLeft, Ticket, AlertTriangle, Image, X, Upload, User as UserIcon, Eye, Pencil, RotateCcw, Save } from 'lucide-react';
import LiquidGlassCard from '@/components/LiquidGlassCard';
import NeuButton from '@/components/NeuButton';
import { itemVariants, errorShakeVariants } from '@/lib/animations';

const categories = ['Electrical', 'Plumbing', 'HVAC', 'IT Equipment', 'Furniture', 'Cleaning', 'Safety', 'Other'];

const priorityColors: Record<string, { bg: string; border: string; text: string }> = {
  AUTO: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', text: 'text-sky-300' },
  LOW: { bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.2)', text: 'text-slate-400' },
  MEDIUM: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: 'text-amber-400' },
  HIGH: { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', text: 'text-orange-400' },
  CRITICAL: { bg: 'rgba(244,63,94,0.12)', border: 'rgba(244,63,94,0.3)', text: 'text-rose-400' },
};

const normalizePhoneNumber = (value: string) => value.replace(/\D/g, '').slice(0, 10);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_SIZE_LABEL = '10MB';
const MAX_ANNOTATED_IMAGE_DIMENSION = 1600;
const ANNOTATED_IMAGE_TYPE = 'image/jpeg';

const getAnnotatedFileName = (name: string) => {
  const baseName = name.replace(/\.[^.]+$/, '') || 'annotated-evidence';
  return `${baseName}-annotated.jpg`;
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));

const exportAnnotatedImage = async (image: HTMLImageElement, annotationCanvas: HTMLCanvasElement) => {
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  const scale = Math.min(1, MAX_ANNOTATED_IMAGE_DIMENSION / Math.max(originalWidth, originalHeight));
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = Math.max(1, Math.round(originalWidth * scale));
  exportCanvas.height = Math.max(1, Math.round(originalHeight * scale));
  const exportContext = exportCanvas.getContext('2d');
  if (!exportContext) {
    return null;
  }

  exportContext.fillStyle = '#ffffff';
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.drawImage(image, 0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.drawImage(annotationCanvas, 0, 0, exportCanvas.width, exportCanvas.height);

  for (const quality of [0.86, 0.76, 0.66, 0.56, 0.46]) {
    const blob = await canvasToBlob(exportCanvas, ANNOTATED_IMAGE_TYPE, quality);
    if (blob && blob.size <= MAX_IMAGE_SIZE_BYTES) {
      return blob;
    }
  }

  return canvasToBlob(exportCanvas, ANNOTATED_IMAGE_TYPE, 0.36);
};

export default function TicketFormPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalImageRef = useRef<HTMLImageElement>(null);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '', facilityId: '', location: '', category: 'AUTO',
    description: '', priority: 'AUTO', contactEmail: '', contactPhone: '',
    assignedTo: '', assignedToName: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { isAdmin, isSuperAdmin, isManager } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [previewModal, setPreviewModal] = useState<{ index: number; mode: 'preview' | 'annotate' } | null>(null);
  const [brushColor, setBrushColor] = useState('#ef4444');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [annotationPreview, setAnnotationPreview] = useState('');

  useEffect(() => {
    facilityApi.getAll().then(res => setFacilities(res.data)).finally(() => setLoading(false));
    if (isAdmin || isSuperAdmin || isManager) {
      authApi.getUsers().then(res => setUsers(res.data)).catch(() => {});
    }
  }, [isAdmin, isSuperAdmin, isManager]);

  const handleTechChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    const user = users.find(u => u.id === userId);
    setForm(prev => ({
      ...prev,
      assignedTo: userId,
      assignedToName: user ? user.name : ''
    }));
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

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
      setAnnotationPreview(previews[previewModal.index] || '');
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
  }, [previewModal, previews]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    else if (form.title.length < 5) errors.title = 'Title must be at least 5 characters';
    
    if (!form.location.trim()) errors.location = 'Location is required';
    
    if (!form.description.trim()) errors.description = 'Description is required';
    else if (form.description.length < 20) errors.description = 'Please provide more detail (min 20 chars)';

    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errors.contactEmail = 'Invalid email format';
    }

    if (form.contactPhone && !/^[0-9]{10}$/.test(form.contactPhone)) {
      errors.contactPhone = 'Phone number must be exactly 10 digits';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const oversizedFile = files.find(file => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversizedFile) {
      setError(`${oversizedFile.name} is too large. Each evidence image must be ${MAX_IMAGE_SIZE_LABEL} or smaller.`);
      setShakeKey(k => k + 1);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const remaining = 3 - attachments.length;
    const toAdd = files.slice(0, remaining);
    setAttachments(prev => [...prev, ...toAdd]);
    const newPreviews = toAdd.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
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

    const canvas = annotationCanvasRef.current;
    const context = canvas?.getContext('2d');
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
      setAnnotationPreview(previews[previewModal.index] || '');
    }
  };

  const refreshAnnotationPreview = () => {
    const image = modalImageRef.current;
    const annotationCanvas = annotationCanvasRef.current;
    if (!image || !annotationCanvas) {
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
    setAnnotationPreview(exportCanvas.toDataURL(attachments[previewModal?.index ?? 0]?.type || 'image/png'));
  };

  const saveAnnotation = () => {
    if (!previewModal) {
      return;
    }

    const image = modalImageRef.current;
    const annotationCanvas = annotationCanvasRef.current;
    if (!image || !annotationCanvas) {
      return;
    }

    exportAnnotatedImage(image, annotationCanvas).then(blob => {
      if (!blob) {
        return;
      }

      if (blob.size > MAX_IMAGE_SIZE_BYTES) {
        setError(`Annotated image is too large. Each evidence image must be ${MAX_IMAGE_SIZE_LABEL} or smaller.`);
        setShakeKey(k => k + 1);
        return;
      }

      const originalFile = attachments[previewModal.index];
      const originalName = getAnnotatedFileName(originalFile?.name || `annotated-${previewModal.index + 1}.jpg`);
      const mimeType = ANNOTATED_IMAGE_TYPE;
      const nextFile = new File([blob], originalName, { type: mimeType });
      const nextPreview = URL.createObjectURL(blob);

      setAttachments(prev => prev.map((file, index) => index === previewModal.index ? nextFile : file));
      setPreviews(prev => prev.map((url, index) => {
        if (index !== previewModal.index) {
          return url;
        }
        URL.revokeObjectURL(url);
        return nextPreview;
      }));
      setPreviewModal({ index: previewModal.index, mode: 'preview' });
      setAnnotationPreview(nextPreview);
      setIsDrawing(false);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validate()) {
      setError('Please fix the errors below');
      setShakeKey(k => k + 1);
      return;
    }

    setSaving(true);
    try {
      const ticketPayload = {
        ...form,
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        category: form.category === 'AUTO' ? undefined : form.category,
        priority: form.priority === 'AUTO' ? undefined : form.priority,
      };

      if (attachments.length > 0) {
        // Use multipart upload
        const formData = new FormData();
        const ticketFile = new File(
          [JSON.stringify(ticketPayload)],
          'ticket.json',
          { type: 'application/json' }
        );
        formData.append('ticket', ticketFile);
        attachments.forEach((file, index) => {
          const safeFileName = file.name?.trim() || `attachment-${index + 1}.png`;
          formData.append('files', file, safeFileName);
        });
        await ticketApi.createWithFiles(formData);
      } else {
        await ticketApi.create(ticketPayload);
      }
      navigate('/tickets');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create ticket');
      setShakeKey(k => k + 1);
    } finally { setSaving(false); }
  };

  const pc = priorityColors[form.priority] || priorityColors.AUTO;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
    </div>
  );

  return (
    <motion.div variants={itemVariants} initial="hidden" animate="visible" className="max-w-2xl mx-auto pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-6 transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <LiquidGlassCard depth={3}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: '0 0 16px rgba(245,158,11,0.4)' }}>
            <Ticket className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Report an Issue</h1>
            <p className="text-sm text-slate-400 mt-0.5">Create a maintenance ticket</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div key={shakeKey} variants={errorShakeVariants} initial="idle" animate="shake"
              className="mb-6 p-4 rounded-xl text-sm text-rose-300 font-medium"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)' }}>
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Title *</label>
            <input type="text" value={form.title} 
              onChange={e => {
                setForm({ ...form, title: e.target.value });
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: '' });
              }}
              className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${fieldErrors.title ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
              placeholder="Brief description of the issue" />
            {fieldErrors.title && <p className="text-rose-400 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Related Facility</label>
              <select value={form.facilityId} onChange={e => setForm({ ...form, facilityId: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="">Select facility (optional)</option>
                {facilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Location *</label>
              <input type="text" value={form.location} 
                onChange={e => {
                  setForm({ ...form, location: e.target.value });
                  if (fieldErrors.location) setFieldErrors({ ...fieldErrors, location: '' });
                }}
                className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${fieldErrors.location ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                placeholder="e.g. Block A, Room 101" />
              {fieldErrors.location && <p className="text-rose-400 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.location}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="AUTO">Auto-detect</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm">
                <option value="AUTO">Auto-detect</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          {(isAdmin || isSuperAdmin || isManager) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20">
              <label className="flex items-center gap-2 text-sm font-semibold text-violet-300 mb-3">
                <UserIcon className="w-4 h-4" /> Administrative Assignment
              </label>
              <select 
                value={form.assignedTo} 
                onChange={handleTechChange}
                className="glass-select w-full px-4 py-3 rounded-xl text-sm"
              >
                <option value="">Auto-assign (Default)</option>
                {users.filter(u => u.roles?.some(r => ['TECHNICIAN', 'ADMIN', 'SUPER_ADMIN', 'MANAGER'].includes(r))).map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.roles?.[0]})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-2 ml-1">
                Admins can manually route this ticket to a specific staff member during creation.
              </p>
            </motion.div>
          )}

          {/* Priority indicator */}
          <motion.div layout
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold"
            style={{ background: pc.bg, border: `1px solid ${pc.border}` }}>
            {(form.priority === 'CRITICAL' || form.priority === 'HIGH') && (
              <AlertTriangle className={`w-4 h-4 ${pc.text} ${form.priority === 'CRITICAL' ? 'animate-pulse-glow' : ''}`} />
            )}
            <span className={pc.text}>
              {form.priority === 'AUTO' ? 'AI auto-detect will infer priority from the issue title and description'
              : form.priority === 'CRITICAL' ? '🔴 Critical – Immediate attention required'
              : form.priority === 'HIGH' ? '🟠 High – Resolve as soon as possible'
              : form.priority === 'MEDIUM' ? '🟡 Medium – Standard priority'
              : '⚪ Low – Non-urgent issue'}
            </span>
          </motion.div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Description *</label>
            <textarea value={form.description} 
              onChange={e => {
                setForm({ ...form, description: e.target.value });
                if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: '' });
              }}
              rows={4} className={`glass-input w-full px-4 py-3 rounded-xl text-sm resize-none ${fieldErrors.description ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
              placeholder="Describe the issue in detail…" />
            {fieldErrors.description && <p className="text-rose-400 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.description}</p>}
          </div>

          {/* ─── Image Attachments (up to 3) ─── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Image className="w-4 h-4 text-violet-400" />
                Evidence Photos
                <span className="text-slate-500 font-normal">({attachments.length}/3)</span>
              </label>
              {attachments.length < 3 && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-300 rounded-xl transition-colors"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.22)' }}
                >
                  <Upload className="w-3.5 h-3.5" /> Add Photo
                </motion.button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Drop zone when no attachments */}
            {attachments.length === 0 && (
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.1)' }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  const input = { target: { files: Object.assign(files, { item: (i: number) => files[i] }) } } as unknown as React.ChangeEvent<HTMLInputElement>;
                  handleFileChange(input);
                }}
              >
                <Image className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 font-medium">Click or drag to upload</p>
                <p className="text-xs text-slate-600 mt-1">Up to 3 images, max {MAX_IMAGE_SIZE_LABEL} each (PNG, JPG, etc.)</p>
              </motion.div>
            )}

            {/* Preview grid */}
            {attachments.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {previews.map((src, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="relative rounded-xl overflow-hidden"
                    style={{ aspectRatio: '1', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all" />
                    <div className="absolute top-1.5 left-1.5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewModal({ index: i, mode: 'preview' })}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(15,23,42,0.72)' }}
                        aria-label="Preview image"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewModal({ index: i, mode: 'annotate' })}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(124,58,237,0.78)' }}
                        aria-label="Annotate image"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white transition-opacity"
                      style={{ background: 'rgba(244,63,94,0.8)' }}
                      aria-label="Remove attachment"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute bottom-1.5 left-1.5 text-xs text-white px-2 py-0.5 rounded-full font-medium"
                      style={{ background: 'rgba(0,0,0,0.6)' }}>
                      {attachments[i].name.length > 12 ? attachments[i].name.slice(0, 12) + '…' : attachments[i].name}
                    </div>
                  </motion.div>
                ))}
                {/* Add more slot */}
                {attachments.length < 3 && (
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl cursor-pointer"
                    style={{ aspectRatio: '1', background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.1)' }}
                  >
                    <Upload className="w-5 h-5 text-slate-600 mb-1" />
                    <p className="text-xs text-slate-600">Add more</p>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Email</label>
              <input type="email" value={form.contactEmail} 
                onChange={e => {
                  setForm({ ...form, contactEmail: e.target.value });
                  if (fieldErrors.contactEmail) setFieldErrors({ ...fieldErrors, contactEmail: '' });
                }}
                className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${fieldErrors.contactEmail ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                placeholder="your@email.com" />
              {fieldErrors.contactEmail && <p className="text-rose-400 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.contactEmail}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Phone</label>
              <input type="tel" value={form.contactPhone}
                inputMode="numeric"
                maxLength={10}
                onChange={e => {
                  setForm({ ...form, contactPhone: normalizePhoneNumber(e.target.value) });
                  if (fieldErrors.contactPhone) setFieldErrors({ ...fieldErrors, contactPhone: '' });
                }}
                className={`glass-input w-full px-4 py-3 rounded-xl text-sm ${fieldErrors.contactPhone ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
                placeholder="0771234567" />
              {fieldErrors.contactPhone && <p className="text-rose-400 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.contactPhone}</p>}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <NeuButton type="submit" loading={saving} variant="primary" fullWidth icon={<Ticket className="w-4 h-4" />} iconPosition="left">
              Submit Ticket
            </NeuButton>
            <NeuButton type="button" onClick={() => navigate(-1)} variant="ghost">Cancel</NeuButton>
          </div>
        </form>
      </LiquidGlassCard>

      <AnimatePresence>
        {previewModal && previews[previewModal.index] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(2,6,23,0.82)' }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-5xl rounded-3xl overflow-hidden border border-white/10"
              style={{ background: 'rgba(15,23,42,0.96)', boxShadow: '0 24px 80px rgba(0,0,0,0.45)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {previewModal.mode === 'annotate' ? 'Annotate Evidence Photo' : 'Preview Evidence Photo'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {attachments[previewModal.index]?.name || `Image ${previewModal.index + 1}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModal(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-300 hover:text-white"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewModal.mode === 'annotate' && (
                <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    Color
                    <input
                      type="color"
                      value={brushColor}
                      onChange={event => setBrushColor(event.target.value)}
                      className="w-10 h-10 rounded-lg bg-transparent border border-white/10"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    Brush
                    <input
                      type="range"
                      min="2"
                      max="16"
                      value={brushSize}
                      onChange={event => setBrushSize(Number(event.target.value))}
                    />
                    <span className="text-xs text-slate-400 w-6">{brushSize}</span>
                  </label>
                  <button
                    type="button"
                    onClick={resetAnnotation}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-200 border border-white/10"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                  <button
                    type="button"
                    onClick={saveAnnotation}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white border border-emerald-400/20"
                    style={{ background: 'rgba(16,185,129,0.18)' }}
                  >
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
                        src={previews[previewModal.index]}
                        alt={`Evidence ${previewModal.index + 1}`}
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
                          src={annotationPreview || previews[previewModal.index]}
                          alt={`Annotated preview ${previewModal.index + 1}`}
                          className="block max-h-[52vh] w-full rounded-xl object-contain"
                        />
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        Draw on the left image. The saved file will use the annotated preview shown here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
