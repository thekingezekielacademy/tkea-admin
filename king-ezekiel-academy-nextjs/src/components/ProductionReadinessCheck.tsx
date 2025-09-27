'use client';

import React, { useState, useEffect } from 'react';
import { ProductionEnvValidator, validateProductionEnvironment } from '@/utils/productionEnvValidator';
import { FaCheck, FaExclamationTriangle, FaTimes, FaInfoCircle } from 'react-icons/fa';

interface ProductionReadinessCheckProps {
  showInDevelopment?: boolean;
  className?: string;
}

const ProductionReadinessCheck: React.FC<ProductionReadinessCheckProps> = ({
  showInDevelopment = false,
  className = ''
}) => {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const runValidation = async () => {
      try {
        setIsLoading(true);
        const result = validateProductionEnvironment();
        setValidationResult(result);
        
        // Show component if there are issues or if in development
        const shouldShow = showInDevelopment || !result.isValid || result.warnings.length > 0;
        setIsVisible(shouldShow);
      } catch (error) {
        console.error('Error validating production environment:', error);
        setValidationResult({
          isValid: false,
          errors: ['Failed to validate environment'],
          warnings: [],
          missing: [],
          recommendations: []
        });
        setIsVisible(true);
      } finally {
        setIsLoading(false);
      }
    };

    runValidation();
  }, [showInDevelopment]);

  if (isLoading || !isVisible || !validationResult) {
    return null;
  }

  const getStatusIcon = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return <FaTimes className="text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'success':
        return <FaCheck className="text-green-500" />;
    }
  };

  const getStatusColor = (type: 'error' | 'warning' | 'success') => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'success':
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <div className={`border rounded-lg shadow-lg p-4 ${getStatusColor(
        validationResult.errors.length > 0 ? 'error' : 
        validationResult.warnings.length > 0 ? 'warning' : 'success'
      )}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(
              validationResult.errors.length > 0 ? 'error' : 
              validationResult.warnings.length > 0 ? 'warning' : 'success'
            )}
            <h3 className="font-semibold text-sm">
              Production Readiness
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Status Summary */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium">
              {validationResult.isValid ? 'Ready for Production' : 'Issues Found'}
            </span>
            <div className="flex space-x-1">
              {validationResult.errors.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {validationResult.errors.length} Error{validationResult.errors.length !== 1 ? 's' : ''}
                </span>
              )}
              {validationResult.warnings.length > 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {validationResult.warnings.length} Warning{validationResult.warnings.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Errors */}
        {validationResult.errors.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-red-800 mb-2 flex items-center">
              <FaTimes className="mr-1" />
              Critical Issues
            </h4>
            <ul className="space-y-1">
              {validationResult.errors.map((error: string, index: number) => (
                <li key={index} className="text-xs text-red-700 flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {validationResult.warnings.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-yellow-800 mb-2 flex items-center">
              <FaExclamationTriangle className="mr-1" />
              Warnings
            </h4>
            <ul className="space-y-1">
              {validationResult.warnings.map((warning: string, index: number) => (
                <li key={index} className="text-xs text-yellow-700 flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {validationResult.recommendations.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-blue-800 mb-2 flex items-center">
              <FaInfoCircle className="mr-1" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {validationResult.recommendations.map((rec: string, index: number) => (
                <li key={index} className="text-xs text-blue-700 flex items-start">
                  <span className="mr-2 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => {
              const template = ProductionEnvValidator.generateEnvTemplate();
              navigator.clipboard.writeText(template);
              alert('Environment template copied to clipboard!');
            }}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
          >
            Copy Env Template
          </button>
          <button
            onClick={() => {
              const checklist = ProductionEnvValidator.getProductionChecklist();
              navigator.clipboard.writeText(checklist.join('\n'));
              alert('Production checklist copied to clipboard!');
            }}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
          >
            Copy Checklist
          </button>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {validationResult.isValid 
              ? '✅ Environment is ready for production deployment'
              : '⚠️ Please fix the issues above before deploying to production'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductionReadinessCheck;
