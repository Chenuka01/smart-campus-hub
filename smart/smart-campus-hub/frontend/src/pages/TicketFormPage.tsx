import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { facilityApi, ticketApi } from '@/lib/api';
import type { Facility } from '@/lib/types';
import { ArrowLeft, Ticket, AlertTriangle, Image, X, Upload, Eye, Pencil, RotateCcw, Check } from 'lucide-react';
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

export default function TicketFormPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotationColor, setAnnotationColor] = useState('#ef4444');
  const [annotationBrushSize, setAnnotationBrushSize] = useState(4);
  const [form, setForm] = useState({
    title: '', facilityId: '', location: '', category: 'AUTO',
    description: '', priority: 'AUTO', contactEmail: '', contactPhone: '',
  });

  useEffect(() => {
    facilityApi.getAll().then(res => setFacilities(res.data)).finally(() => setLoading(false));
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    if (previewIndex === null || !annotationMode || !previews[previewIndex]) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new window.Image();
    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = previews[previewIndex];
  }, [previewIndex, annotationMode, previews]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
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
    if (previewIndex === index) {
      setPreviewIndex(null);
      setAnnotationMode(false);
    } else if (previewIndex !== null && previewIndex > index) {
      setPreviewIndex(previewIndex - 1);
    }
  };

  const updateAttachmentAt = (index: number, nextFile: File) => {
    setAttachments(prev => prev.map((file, i) => i === index ? nextFile : file));
    setPreviews(prev => prev.map((url, i) => {
      if (i !== index) return url;
      URL.revokeObjectURL(url);
      return URL.createObjectURL(nextFile);
    }));
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    ctx.strokeStyle = annotationColor;
    ctx.lineWidth = annotationBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const point = getCanvasPoint(event);
    if (!canvas || !point) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const resetAnnotation = () => {
    if (previewIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = new window.Image();
    image.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = previews[previewIndex];
  };

  const saveAnnotation = async () => {
    if (previewIndex === null) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;

    const original = attachments[previewIndex];
    const annotatedFile = new File([blob], original.name.replace(/\.[^.]+$/, '') + '-annotated.png', {
      type: 'image/png',
    });
    updateAttachmentAt(previewIndex, annotatedFile);
    setAnnotationMode(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (attachments.length > 0) {
        // Use multipart upload
        const formData = new FormData();
        const ticketBlob = new Blob([JSON.stringify(form)], { type: 'application/json' });
        formData.append('ticket', ticketBlob);
        attachments.forEach(f => formData.append('files', f));
        await ticketApi.createWithFiles(formData);
      } else {
        await ticketApi.create(form);
      }
      navigate('/tickets');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create ticket');
      setShakeKey(k => k + 1);
    } finally { setSaving(false); }
  };

  const pc = priorityColors[form.priority] || priorityColors.AUTO;
  const modalPreviewSrc = previewIndex !== null ? previews[previewIndex] : null;

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
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-sm"
              placeholder="Brief description of the issue" required />
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
              <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="e.g. Block A, Room 101" required />
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
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4} className="glass-input w-full px-4 py-3 rounded-xl text-sm resize-none"
              placeholder="Describe the issue in detail…" required />
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
                <p className="text-xs text-slate-600 mt-1">Up to 3 images as evidence (PNG, JPG, etc.)</p>
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
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-white transition-opacity"
                    style={{ background: 'rgba(244,63,94,0.8)' }}
                    aria-label="Remove attachment"
                  >
                    <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="absolute top-1.5 left-1.5 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setPreviewIndex(i); setAnnotationMode(false); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(15,23,42,0.75)' }}
                        aria-label="Preview attachment"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setPreviewIndex(i); setAnnotationMode(true); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                        style={{ background: 'rgba(124,58,237,0.85)' }}
                        aria-label="Annotate attachment"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
              <input type="email" value={form.contactEmail} onChange={e => setForm({ ...form, contactEmail: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Phone</label>
              <input type="tel" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                className="glass-input w-full px-4 py-3 rounded-xl text-sm"
                placeholder="+94 77 123 4567" />
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
        {previewIndex !== null && modalPreviewSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(2, 6, 23, 0.82)', backdropFilter: 'blur(10px)' }}
            onClick={() => { setPreviewIndex(null); setAnnotationMode(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 18 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 18 }}
              className="w-full max-w-5xl rounded-3xl p-5"
              style={{
                background: 'rgba(15, 23, 42, 0.92)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Evidence Preview</h2>
                  <p className="text-sm text-slate-400">
                    {annotationMode ? 'Draw arrows or marks directly on the image, then save the annotated version.' : 'Review the uploaded evidence image or open annotation mode.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!annotationMode && (
                    <NeuButton size="sm" variant="secondary" onClick={() => setAnnotationMode(true)} icon={<Pencil className="w-4 h-4" />} iconPosition="left">
                      Annotate
                    </NeuButton>
                  )}
                  {annotationMode && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAnnotationColor('#ef4444')}
                        className="w-9 h-9 rounded-full border"
                        style={{ background: '#ef4444', borderColor: annotationColor === '#ef4444' ? 'white' : 'rgba(255,255,255,0.2)' }}
                        aria-label="Red annotation"
                      />
                      <button
                        type="button"
                        onClick={() => setAnnotationColor('#facc15')}
                        className="w-9 h-9 rounded-full border"
                        style={{ background: '#facc15', borderColor: annotationColor === '#facc15' ? 'white' : 'rgba(255,255,255,0.2)' }}
                        aria-label="Yellow annotation"
                      />
                      <button
                        type="button"
                        onClick={() => setAnnotationColor('#22c55e')}
                        className="w-9 h-9 rounded-full border"
                        style={{ background: '#22c55e', borderColor: annotationColor === '#22c55e' ? 'white' : 'rgba(255,255,255,0.2)' }}
                        aria-label="Green annotation"
                      />
                      <select
                        value={annotationBrushSize}
                        onChange={e => setAnnotationBrushSize(Number(e.target.value))}
                        className="glass-select px-3 py-2 rounded-xl text-sm"
                      >
                        <option value={2}>Thin</option>
                        <option value={4}>Medium</option>
                        <option value={7}>Bold</option>
                      </select>
                      <NeuButton size="sm" variant="ghost" onClick={resetAnnotation} icon={<RotateCcw className="w-4 h-4" />} iconPosition="left">
                        Reset
                      </NeuButton>
                      <NeuButton size="sm" variant="primary" onClick={saveAnnotation} icon={<Check className="w-4 h-4" />} iconPosition="left">
                        Save
                      </NeuButton>
                    </>
                  )}
                  <NeuButton size="sm" variant="ghost" onClick={() => { setPreviewIndex(null); setAnnotationMode(false); }}>
                    Close
                  </NeuButton>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center p-3">
                {annotationMode ? (
                  <canvas
                    ref={canvasRef}
                    className="w-full max-h-[70vh] rounded-xl touch-none"
                    style={{ cursor: 'crosshair' }}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                  />
                ) : (
                  <img
                    src={modalPreviewSrc}
                    alt={`Attachment ${previewIndex + 1}`}
                    className="w-full max-h-[70vh] object-contain rounded-xl"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
