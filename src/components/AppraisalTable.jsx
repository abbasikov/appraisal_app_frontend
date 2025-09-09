import React, { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  PhotoIcon,
  TrashIcon,
  Bars3Icon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LoadingSpinner from './ui/LoadingSpinner';
import Modal from './ui/Modal';

const AppraisalTable = ({ items, onItemUpdate, onItemsReorder, loading }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingCell, setEditingCell] = useState(null);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      return;
    }

    const newItems = [...items];
    const [movedItem] = newItems.splice(draggedItem.index, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update line numbers
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      line_number: index + 1,
      sort_order: index + 1
    }));

    onItemsReorder(updatedItems);
    setDraggedItem(null);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1
    }));

    onItemsReorder(updatedItems);
  };

  const handleMoveDown = (index) => {
    if (index === items.length - 1) return;
    
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      line_number: idx + 1,
      sort_order: idx + 1
    }));

    onItemsReorder(updatedItems);
  };

  const handleCellEdit = (itemId, field, value) => {
    onItemUpdate(itemId, { [field]: value });
    setEditingCell(null);
  };

  const handleCellClick = (itemId, field) => {
    setEditingCell(`${itemId}-${field}`);
  };

  const formatCurrency = (value) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const handlePhotoClick = (item) => {
    setSelectedPhoto(item);
    setPhotoModalOpen(true);
  };

  if (loading) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-500 mt-4">Loading appraisal items...</p>
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-12 text-center">
        <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No appraisal items found</h3>
        <p className="text-gray-500 mb-6">
          Click "Initialize from Photos" to create items from project photos
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Upload photos to your project first, then initialize appraisal items to get started quickly.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell w-16">#</th>
                <th className="table-header-cell w-20">Photo</th>
                <th className="table-header-cell">Room/Area</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Description</th>
                <th className="table-header-cell w-32">Value ($)</th>
                <th className="table-header-cell w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {items.map((item, index) => (
                <tr
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="table-row cursor-move group"
                >
                  {/* Line Number */}
                  <td className="table-cell">
                    <div className="flex items-center space-x-2">
                      <Bars3Icon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      <Badge variant="gray" size="sm">{item.line_number}</Badge>
                    </div>
                  </td>

                  {/* Photo Thumbnail */}
                  <td className="table-cell">
                    {item.photo_thumbnail ? (
                      <div className="relative group/photo">
                        <img
                          src={`/api/v1/photos/thumbnail/${item.photo_id}`}
                          alt={item.photo_filename}
                          className="h-12 w-12 object-cover rounded-lg cursor-pointer hover:shadow-md transition-all duration-200"
                          onClick={() => handlePhotoClick(item)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/photo:bg-opacity-20 rounded-lg flex items-center justify-center transition-all duration-200">
                          <MagnifyingGlassIcon className="h-4 w-4 text-white opacity-0 group-hover/photo:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </td>

                  {/* Room/Area */}
                  <td className="table-cell">
                    {editingCell === `${item.id}-room_area` ? (
                      <input
                        type="text"
                        defaultValue={item.room_area || ''}
                        className="form-input text-sm"
                        onBlur={(e) => handleCellEdit(item.id, 'room_area', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit(item.id, 'room_area', e.target.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        onClick={() => handleCellClick(item.id, 'room_area')}
                      >
                        {item.room_area || <span className="text-gray-400 italic">Click to edit</span>}
                      </div>
                    )}
                  </td>

                  {/* Type */}
                  <td className="table-cell">
                    {editingCell === `${item.id}-item_type` ? (
                      <select
                        defaultValue={item.item_type || ''}
                        className="form-input text-sm"
                        onBlur={(e) => handleCellEdit(item.id, 'item_type', e.target.value)}
                        onChange={(e) => handleCellEdit(item.id, 'item_type', e.target.value)}
                        autoFocus
                      >
                        <option value="">Select Type</option>
                        <option value="art">Art</option>
                        <option value="jewelry">Jewelry</option>
                        <option value="furniture">Furniture</option>
                        <option value="collectibles">Collectibles</option>
                        <option value="electronics">Electronics</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        onClick={() => handleCellClick(item.id, 'item_type')}
                      >
                        {item.item_type ? (
                          <Badge variant="info" size="sm" className="capitalize">
                            {item.item_type}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 italic text-sm">Click to select</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td className="table-cell">
                    {editingCell === `${item.id}-description` ? (
                      <textarea
                        defaultValue={item.description || ''}
                        className="form-input text-sm resize-none"
                        rows="2"
                        onBlur={(e) => handleCellEdit(item.id, 'description', e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCellEdit(item.id, 'description', e.target.value);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="text-sm text-gray-900 cursor-pointer hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-blue-200 max-w-xs"
                        onClick={() => handleCellClick(item.id, 'description')}
                      >
                        {item.description || <span className="text-gray-400 italic">Click to edit</span>}
                      </div>
                    )}
                  </td>

                  {/* Value */}
                  <td className="table-cell">
                    {editingCell === `${item.id}-appraised_value` ? (
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={item.appraised_value || ''}
                        className="form-input text-sm"
                        onBlur={(e) => handleCellEdit(item.id, 'appraised_value', parseFloat(e.target.value) || 0)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit(item.id, 'appraised_value', parseFloat(e.target.value) || 0);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <div
                        className="cursor-pointer hover:bg-green-50 px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-green-200"
                        onClick={() => handleCellClick(item.id, 'appraised_value')}
                      >
                        <span className="font-semibold text-green-700">
                          {formatCurrency(item.appraised_value)}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="table-cell">
                    <div className="flex items-center space-x-1">
                      <Button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        variant="ghost"
                        size="sm"
                        icon={ChevronUpIcon}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <Button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === items.length - 1}
                        variant="ghost"
                        size="sm"
                        icon={ChevronDownIcon}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Row */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Badge variant="info" size="lg">
                {items.length} Items
              </Badge>
              <span className="text-sm text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Appraised Value</p>
              <p className="text-2xl font-bold text-green-700">
                {formatCurrency(items.reduce((sum, item) => sum + (item.appraised_value || 0), 0))}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Photo Modal */}
      <Modal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        title={selectedPhoto?.photo_filename || 'Photo'}
        size="lg"
      >
        {selectedPhoto && (
          <div className="space-y-4">
            <img
              src={`/api/v1/photos/${selectedPhoto.photo_id}`}
              alt={selectedPhoto.photo_filename}
              className="w-full h-auto rounded-lg shadow-medium"
            />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Room/Area:</span>
                <p className="text-gray-900">{selectedPhoto.room_area || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900 capitalize">{selectedPhoto.item_type || 'Not specified'}</p>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-700">Description:</span>
                <p className="text-gray-900">{selectedPhoto.description || 'No description'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Appraised Value:</span>
                <p className="text-green-700 font-semibold">{formatCurrency(selectedPhoto.appraised_value)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AppraisalTable;