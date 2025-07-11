import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  ExternalLink, 
  Star, 
  Bookmark, 
  Folder,
  Globe,
  Eye,
  X,
  Save,
  Trash2
} from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';

import { api } from '@/services/api';
import { Resource, ResourceGroup, ResourceCreate, ResourceGroupCreate } from '@/types';

export default function Resources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isResourceFormOpen, setIsResourceFormOpen] = useState(false);
  const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState<ResourceCreate>({
    name: '',
    url: '',
    description: '',
    group_id: '',
    tags: '',
    is_favorite: false
  });
  const [groupForm, setGroupForm] = useState<ResourceGroupCreate>({
    name: '',
    description: '',
    color: '#3B82F6',
    is_active: true
  });

  const queryClient = useQueryClient();

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ['resources'],
    queryFn: () => api.get('/resources/').then(res => res.data)
  });

  // Fetch groups
  const { data: groups = [] } = useQuery({
    queryKey: ['resource-groups'],
    queryFn: () => api.get('/resources/groups/').then(res => res.data)
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: (resource: ResourceCreate) => api.post('/resources/', resource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setIsResourceFormOpen(false);
      setResourceForm({
        name: '',
        url: '',
        description: '',
        group_id: '',
        tags: '',
        is_favorite: false
      });
    }
  });

  // Create group mutation
  const createGroupMutation = useMutation({
    mutationFn: (group: ResourceGroupCreate) => api.post('/resources/groups/', group),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resource-groups'] });
      setIsGroupFormOpen(false);
      setGroupForm({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true
      });
    }
  });

  // Visit resource mutation
  const visitResourceMutation = useMutation({
    mutationFn: (resourceId: string) => api.post(`/resources/${resourceId}/visit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (resourceId: string) => api.delete(`/resources/${resourceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource: Resource) => {
      const matchesSearch = resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resource.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesGroup = selectedGroup ? resource.group_id === selectedGroup : true;
      return matchesSearch && matchesGroup;
    });
  }, [resources, searchTerm, selectedGroup]);

  const handleVisitResource = useCallback((resource: Resource) => {
    window.open(resource.url, '_blank');
    visitResourceMutation.mutate(resource.id);
  }, [visitResourceMutation]);

  const handleDeleteResource = useCallback((resource: Resource) => {
    if (window.confirm(`Are you sure you want to delete "${resource.name}"? This action cannot be undone.`)) {
      deleteResourceMutation.mutate(resource.id);
    }
  }, [deleteResourceMutation]);

  const handleCreateResource = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (resourceForm.name && resourceForm.url) {
      createResourceMutation.mutate({
        ...resourceForm,
        group_id: resourceForm.group_id || undefined
      });
    }
  }, [resourceForm, createResourceMutation]);

  const handleCreateGroup = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (groupForm.name) {
      createGroupMutation.mutate(groupForm);
    }
  }, [groupForm, createGroupMutation]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className='space-y-6'
      variants={containerVariants}
      initial='hidden'
      animate='visible'
    >
      {/* Header */}
      <motion.div variants={itemVariants} className='relative'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div>
            <div className='flex items-center gap-4 mb-2'>
              <h1 className='text-2xl font-bold text-neutral-900'>Resources</h1>
              <div className='inline-flex items-center gap-2 px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200'>
                <Bookmark className='h-4 w-4 text-neutral-600' />
                <span className='text-sm font-medium text-neutral-700'>Bookmark Manager</span>
              </div>
            </div>
            <p className='text-sm text-neutral-600'>
              Organize and manage your important resources with groups and favorites
            </p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setIsGroupFormOpen(true)}
              className="px-4 py-2 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Folder className='h-4 w-4' />
              New Group
            </motion.button>
            <motion.button
              onClick={() => setIsResourceFormOpen(true)}
              className='px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-2'
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className='h-4 w-4' />
              Add Resource
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
          />
        </div>
        <select
          value={selectedGroup || ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
        >
          <option value="">All Groups</option>
          <option value="ungrouped">Ungrouped</option>
          {groups.map((group: ResourceGroup) => (
            <option key={group.id} value={group.id}>{group.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Resources Grid */}
      {resources.length > 0 ? (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource: Resource) => (
            <motion.div
              key={resource.id}
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">{resource.name}</h3>
                  {resource.description && (
                    <p className="text-sm text-neutral-600 mb-2 line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Globe className="h-3 w-3" />
                    <span className="truncate">{new URL(resource.url).hostname}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {resource.is_favorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                  <button
                    onClick={() => handleVisitResource(resource)}
                    className="p-1 text-neutral-400 hover:text-neutral-600"
                    title="Open resource"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteResource(resource)}
                    className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                    title="Delete resource"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  <span>{resource.visit_count} visits</span>
                </div>
                {resource.group && (
                  <div className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    <span>{resource.group.name}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* Empty state */
        <motion.div
          variants={itemVariants}
          className="text-center py-16"
        >
          <Bookmark className="h-20 w-20 text-neutral-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-neutral-900 mb-3">No resources yet</h3>
          <p className="text-neutral-600 mb-8 max-w-md mx-auto">
            Start building your resource collection by adding websites, tools, and links you want to keep organized.
          </p>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              onClick={() => setIsResourceFormOpen(true)}
              className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Your First Resource
            </motion.button>
            <motion.button
              onClick={() => setIsGroupFormOpen(true)}
              className="px-6 py-3 bg-white border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create a Group
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Resource Form Modal */}
      <AnimatePresence>
        {isResourceFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsResourceFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Add Resource</h3>
                <button
                  onClick={() => setIsResourceFormOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateResource} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                    placeholder="Resource name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    URL *
                  </label>
                  <input
                    type="url"
                    value={resourceForm.url}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                    rows={3}
                    placeholder="Brief description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Group
                  </label>
                  <select
                    value={resourceForm.group_id}
                    onChange={(e) => setResourceForm(prev => ({ ...prev, group_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                  >
                    <option value="">No group</option>
                    {groups.map((group: ResourceGroup) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={resourceForm.is_favorite}
                      onChange={(e) => setResourceForm(prev => ({ ...prev, is_favorite: e.target.checked }))}
                      className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                    />
                    <span className="text-sm text-neutral-700">Add to favorites</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsResourceFormOpen(false)}
                    className="flex-1 px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createResourceMutation.isPending}
                    className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createResourceMutation.isPending ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Group Form Modal */}
      <AnimatePresence>
        {isGroupFormOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsGroupFormOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">Create Group</h3>
                <button
                  onClick={() => setIsGroupFormOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={groupForm.name}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                    placeholder="Group name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={groupForm.description}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500"
                    rows={3}
                    placeholder="Brief description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Color
                  </label>
                  <input
                    type="color"
                    value={groupForm.color}
                    onChange={(e) => setGroupForm(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 border border-neutral-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsGroupFormOpen(false)}
                    className="flex-1 px-4 py-2 text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createGroupMutation.isPending}
                    className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {createGroupMutation.isPending ? (
                      'Creating...'
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
} 