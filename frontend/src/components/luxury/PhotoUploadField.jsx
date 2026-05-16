import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Single-photo upload field with preview + remove.
 * - value: current image URL (or null)
 * - onChange(url): called when uploaded or removed
 * - profileId: required for backend storage
 * - label: e.g. "Bride", "Groom", "Couple"
 */
const PhotoUploadField = ({ value, onChange, profileId, label, testid }) => {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!profileId) { setErr('Save the wedding draft first'); return; }
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setErr('Max 8 MB'); return; }
    setUploading(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('caption', label || '');
      const res = await axios.post(
        `${API_URL}/api/admin/profiles/${profileId}/upload-photo`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const url = res.data?.url || res.data?.file_url || res.data?.media_url;
      if (url) onChange(url);
      else setErr('Upload OK but no URL returned');
    } catch (e) {
      setErr(e.response?.data?.detail || 'Upload failed');
    } finally { setUploading(false); }
  };

  return (
    <div data-testid={testid}>
      <span className="block text-[10px] tracking-[0.3em] uppercase mb-2" style={{ color: 'rgba(255,248,220,0.55)' }}>
        {label}
      </span>
      <div
        className="lux-glass relative overflow-hidden rounded-xl cursor-pointer transition-all"
        style={{ height: 200, border: value ? '1px solid rgba(212,175,55,0.5)' : '1px dashed rgba(212,175,55,0.35)' }}
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <>
            <img src={value.startsWith('http') ? value : `${API_URL}${value}`} alt={label}
              className="absolute inset-0 w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full grid place-items-center"
              style={{ background: 'rgba(8,5,3,0.7)', color: '#FFB0A0', border: '1px solid rgba(139,0,0,0.4)' }}
              data-testid={`${testid}-remove`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-center px-4">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: '#D4AF37' }} />
                <span className="text-xs" style={{ color: 'rgba(255,248,220,0.6)' }}>Uploading…</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-7 h-7" style={{ color: '#D4AF37' }} />
                <span className="text-xs" style={{ color: 'rgba(255,248,220,0.6)' }}>Click to upload</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,248,220,0.4)' }}>PNG / JPG · max 8 MB</span>
              </div>
            )}
          </div>
        )}
      </div>
      <input
        ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
        data-testid={`${testid}-input`}
      />
      {err && <div className="mt-2 text-xs" style={{ color: '#FFB0A0' }}>{err}</div>}
    </div>
  );
};

export default PhotoUploadField;
