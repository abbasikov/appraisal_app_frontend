import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 20,
  totalItems = 0,
  showInfo = true
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((page, index, arr) => arr.indexOf(page) === index);
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return showInfo ? (
      <div className="flex items-center justify-between px-2 py-4 text-sm text-gray-500 max-lg:text-xs">
        <span>Showing {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
      </div>
    ) : null;
  }

  return (
    <div className="flex flex-row items-center justify-between gap-3 py-4 max-lg:flex-col max-lg:gap-3">
      {showInfo && (
        <div className="text-left text-sm text-gray-500 max-lg:text-center max-lg:text-xs">
          Showing {totalItems > 0 ? startItem : 0} to {endItem} of {totalItems} items
        </div>
      )}
      
      <div className="flex items-center justify-end gap-1 max-lg:justify-center">
        {/* Previous button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`inline-flex min-h-0 min-w-0 items-center justify-center rounded-md p-2 max-lg:min-h-10 max-lg:min-w-10 ${currentPage <= 1 
            ? 'cursor-not-allowed text-gray-300' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="flex flex-wrap items-center justify-center gap-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-sm text-gray-500 max-lg:px-2 max-lg:text-xs">...</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`rounded-md px-3 py-1 text-sm max-lg:min-h-9 max-lg:min-w-9 max-lg:px-2 max-lg:py-1.5 max-lg:text-xs ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`inline-flex min-h-0 min-w-0 items-center justify-center rounded-md p-2 max-lg:min-h-10 max-lg:min-w-10 ${currentPage >= totalPages 
            ? 'cursor-not-allowed text-gray-300' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
