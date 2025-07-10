import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Trash2, Plus, FileText } from 'lucide-react';
import { api } from '@/services/api';

interface TemplateFile {
  id: string;
  name: string;
  file_type: 'resume' | 'cover_letter';
  filename: string;
  file_path: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface TemplateFileManagerProps {
  fileType: 'resume' | 'cover_letter';
  title: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileType: 'resume' | 'cover_letter';
  onSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, fileType, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.name.trim()) return;

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('name', formData.name);
      uploadData.append('file_type', fileType);
      uploadData.append('file', formData.file);
      if (formData.description) {
        uploadData.append('description', formData.description);
      }

      await api.post('/template-files/', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onSuccess();
      onClose();
      setFormData({ name: '', description: '', file: null });
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload template file');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <motion.div
        className="modal-content max-w-md"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-neutral-900 mb-4">
            Upload Template {fileType === 'resume' ? 'Resume' : 'Cover Letter'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="e.g., Senior Software Engineer Resume"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                rows={2}
                placeholder="Brief description of when to use this template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => setFormData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                className="input-field"
                required
              />
              <p className="text-xs text-neutral-500 mt-1">
                Supported formats: PDF, DOC, DOCX
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <motion.button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={isUploading || !formData.file || !formData.name.trim()}
                className="btn-primary flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const TemplateFileManager: React.FC<TemplateFileManagerProps> = ({ fileType, title }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<TemplateFile[]>({
    queryKey: ['template-files', fileType],
    queryFn: () => api.get(`/template-files/?file_type=${fileType}`).then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (templateId: string) => api.delete(`/template-files/${templateId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-files', fileType] });
    },
  });

  const handleDownload = (templateId: string) => {
    window.open(`${api.defaults.baseURL}/template-files/${templateId}/download`, '_blank');
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    if (confirm(`Are you sure you want to delete "${templateName}"?`)) {
      try {
        await deleteMutation.mutateAsync(templateId);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete template');
      }
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['template-files', fileType] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-neutral-900">Template {title}</h4>
        <motion.button
          onClick={() => setIsUploadModalOpen(true)}
          className="btn-secondary text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </motion.button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="card p-4 animate-pulse">
              <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-neutral-100 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-neutral-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <motion.div
              key={template.id}
              className="card p-4 hover:shadow-md transition-shadow"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 rounded-lg bg-neutral-100 flex-shrink-0">
                  <FileText className="h-4 w-4 text-neutral-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-neutral-900 truncate" title={template.name}>
                    {template.name}
                  </h5>
                  {template.description && (
                    <p className="text-sm text-neutral-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    {template.filename}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleDownload(template.id)}
                  className="btn-secondary text-xs flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </motion.button>
                <motion.button
                  onClick={() => handleDelete(template.id, template.name)}
                  className="btn-secondary text-xs text-red-600 hover:bg-red-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-12">
          <div className="text-center border-2 border-dashed border-neutral-200 rounded-lg p-8 max-w-sm mx-auto">
            <div className="p-3 rounded-full bg-neutral-100 w-fit mx-auto mb-3">
              <FileText className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-neutral-600 text-sm mb-4">
              No template {title.toLowerCase()} yet
            </p>
            <motion.button
              onClick={() => setIsUploadModalOpen(true)}
              className="btn-primary text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add First Template
            </motion.button>
          </div>
        </div>
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        fileType={fileType}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default TemplateFileManager; 