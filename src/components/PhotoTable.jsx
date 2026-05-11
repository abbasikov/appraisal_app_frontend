import React, { useState, useEffect } from 'react';
import { formatFileSize, formatDate } from '../utils/formatters';
import { TrashIcon } from '@heroicons/react/24/outline';
import { Pagination } from './ui';
import api from '../services/api';

const ThumbnailImage = ({ projectId, photoId, alt, className }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;
    let objectUrl = null;

    const fetchThumbnail = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/projects/${projectId}/photos/${photoId}/thumbnail`, {
          responseType: 'blob'
        });
        objectUrl = URL.createObjectURL(response.data);
        if (!isActive) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setImageSrc(objectUrl);
        setError(false);
      } catch (err) {
        if (!isActive) return;
        console.error('Error loading thumbnail:', err);
        setError(true);
      } finally {
        if (isActive) setLoading(false);
      }
    };

    if (projectId && photoId) {
      fetchThumbnail();
    } else {
      setLoading(false);
      setError(true);
    }

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [projectId, photoId]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse">
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <span className="text-xs text-gray-500">IMG</span>
      </div>
    );
  }

  return (
    <img 
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

const PhotoTable = ({ 
  photos, 
  onPhotoDelete, 
  currentPage = 1,
  totalPages = 1,
  itemsPerPage = 20,
  totalItems = 0,
  onPageChange 
}) => {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No photos imported yet.</p>
        <p className="text-sm mt-2">Add Dropbox links above and click "Import Photos" to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[600px] w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Photo
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Filename
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Date Taken
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Size
            </th>
            <th className="w-14 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {photos.map((photo) => (
            <tr key={photo.id} className="hover:bg-gray-50">
              <td className="px-3 py-4">
                <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                  <ThumbnailImage 
                    projectId={photo.project_id}
                    photoId={photo.id}
                    alt={photo.original_filename}
                    className="w-full h-full object-cover"
                  />
                </div>
              </td>
              <td className="px-3 py-4 min-w-0">
                <div className="text-sm font-medium text-gray-900 max-w-[320px] truncate">
                  {photo.original_filename}
                </div>
                <div className="text-sm text-gray-500">
                  {photo.dropbox_folder_path && photo.dropbox_folder_path !== '/' && (
                    <div className="text-xs text-blue-600">📁 {photo.dropbox_folder_path}</div>
                  )}
                  {photo.width && photo.height && `${photo.width} × ${photo.height}`}
                </div>
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                {formatDate(photo.exif_date)}
              </td>
              <td className="px-3 py-4 text-sm text-gray-900">
                {formatFileSize(photo.file_size)}
              </td>
              <td className="px-2 py-4 text-center text-sm font-medium">
                <button
                  onClick={() => onPhotoDelete(photo.id)}
                  className="inline-flex text-red-600 hover:text-red-900 p-1"
                  title="Delete photo"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const PhotoTableWithPagination = ({ photos, onPhotoDelete, ...paginationProps }) => {
  return (
    <div>
      <PhotoTable 
        photos={photos} 
        onPhotoDelete={onPhotoDelete}
      />
      {paginationProps.totalPages > 1 && (
        <Pagination
          {...paginationProps}
          showInfo={true}
        />
      )}
    </div>
  );
};

export { PhotoTable, PhotoTableWithPagination };
export default PhotoTable;