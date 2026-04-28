import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Loader } from 'lucide-react';
import toast from 'react-hot-toast';
import ErrorBanner from '../components/ErrorBanner';
import useFormValidation from '../hooks/useFormValidation';
import { validateResourceDetails } from '../services/validation';

const ListResource = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    resourceType: '',
    quantity: '',
    price: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const { errors, validate, clearError } = useFormValidation(validateResourceDetails);

  const steps = [
    { num: 1, title: 'Select Resource', description: 'What do you have?' },
    { num: 2, title: 'Upload Photo', description: 'AI will analyze' },
    { num: 3, title: 'Details', description: 'Price & quantity' },
    { num: 4, title: 'Review', description: 'Confirm & publish' },
  ];

  const resourceTypes = [
    { icon: '🧵', label: 'Fabric Scraps', value: 'fabric' },
    { icon: '⚙️', label: 'Machines', value: 'machines' },
    { icon: '👷', label: 'Services', value: 'services' },
    { icon: '🚛', label: 'Transport', value: 'transport' },
    { icon: '🎨', label: 'Chemicals', value: 'chemicals' },
    { icon: '📦', label: 'Materials', value: 'materials' },
  ];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && step === 2) {
      setLoading(true);
      setPreviewUrl(URL.createObjectURL(file));
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setStep(3);
      }, 2000);
    }
  };

  const handleToReview = () => {
    setFormError('');
    const isValid = validate(formData);
    if (!isValid) {
      setFormError('Please correct the highlighted fields before review.');
      return;
    }

    setStep(4);
  };

  const handlePublish = () => {
    if (!formData.resourceType) {
      setFormError('Select a resource type before publishing.');
      setStep(1);
      return;
    }

    const isValid = validate(formData);
    if (!isValid) {
      setFormError('Please complete all required details before publishing.');
      setStep(3);
      return;
    }

    toast.success('Listing published successfully.');
    setFormError('');
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
           <h1 className="text-4xl font-black mb-3">📋 List Your Resources</h1>
           <p className="text-[var(--text-secondary)] text-lg">AI-powered resource listing in just 4 simple steps</p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex gap-4 mb-12"
        >
          {steps.map((s, i) => (
            <div key={i} className="flex-1">
              <motion.div
                className={`py-3 px-4 rounded-lg text-center transition-all ${
                  step >= s.num
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
                }`}
              >
                <p className="font-bold text-lg">{s.num}</p>
                <p className="text-xs mt-1">{s.title}</p>
              </motion.div>
            </div>
          ))}
        </motion.div>

        <ErrorBanner message={formError} />

        {/* Step 1: Select Resource */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card"
          >
            <h3 className="mb-8 text-center">What are you listing?</h3>
            <div className="grid grid-3 gap-4">
              {resourceTypes.map((type, i) => (
                <motion.button
                  key={i}
                  onClick={() => {
                    setFormData({ ...formData, resourceType: type.value });
                    setFormError('');
                    setStep(2);
                  }}
                  whileHover={{ y: -2 }}
                  className="p-6 rounded-lg border-2 border-[var(--border)] hover:border-[var(--primary)] transition-all text-center"
                >
                  <p className="text-3xl mb-3">{type.icon}</p>
                  <p className="font-semibold text-[var(--text)]">{type.label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Upload Photo */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card"
          >
            <h3 className="mb-8 text-center">Upload a Photo</h3>
            <div className="flex flex-col items-center gap-6">
              <label className="relative w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-12 text-center cursor-pointer hover:border-[var(--primary)] transition-colors">
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader className="text-[var(--primary)] mx-auto mb-4" size={32} />
                    </motion.div>
                  ) : previewUrl ? (
                    <img src={previewUrl} alt="Resource preview" className="h-48 w-full rounded-lg object-cover" />
                  ) : (
                    <>
                      <Camera className="text-[var(--primary)] mx-auto mb-4" size={32} />
                      <p className="font-semibold text-[var(--text)] mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-[var(--text-tertiary)]">
                        PNG, JPG, GIF (max. 10MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
              <p className="text-sm text-[var(--text-tertiary)] text-center">
                💡 AI will analyze your resource and auto-fill details
              </p>
              <button
                onClick={() => setStep(3)}
                className="btn btn-outline w-full"
              >
                Skip & Manually Enter Details
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card"
          >
            <h3 className="mb-8">Resource Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block font-semibold text-[var(--text)] mb-2">Quantity</label>
                <input
                  type="text"
                  placeholder="e.g., 500 kg, 10 units, 2 machines"
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: e.target.value });
                    clearError('quantity');
                  }}
                  className="w-full"
                  aria-invalid={Boolean(errors.quantity)}
                />
                {errors.quantity ? <p className="error-text">{errors.quantity}</p> : null}
              </div>
              <div>
                <label className="block font-semibold text-[var(--text)] mb-2">Price</label>
                <input
                  type="number"
                  placeholder="₹ per unit"
                  value={formData.price}
                  onChange={(e) => {
                    setFormData({ ...formData, price: e.target.value });
                    clearError('price');
                  }}
                  className="w-full"
                  aria-invalid={Boolean(errors.price)}
                />
                {errors.price ? <p className="error-text">{errors.price}</p> : null}
              </div>
              <div>
                <label className="block font-semibold text-[var(--text)] mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City or factory name"
                  value={formData.location}
                  onChange={(e) => {
                    setFormData({ ...formData, location: e.target.value });
                    clearError('location');
                  }}
                  className="w-full"
                  aria-invalid={Boolean(errors.location)}
                />
                {errors.location ? <p className="error-text">{errors.location}</p> : null}
              </div>
              <div>
                <label className="block font-semibold text-[var(--text)] mb-2">Description</label>
                <textarea
                  placeholder="Additional details about your resource..."
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    clearError('description');
                  }}
                  className="w-full"
                  aria-invalid={Boolean(errors.description)}
                />
                {errors.description ? <p className="error-text">{errors.description}</p> : null}
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setStep(2)} className="btn btn-secondary flex-1">
                  Back
                </button>
                <button onClick={handleToReview} className="btn btn-primary flex-1">
                  Review
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="card"
          >
            <h3 className="mb-8">Review Your Listing</h3>
            <div className="space-y-6 mb-8">
              <div className="p-6 bg-[var(--surface-active)] rounded-lg">
                <p className="text-[var(--text-muted)] text-sm mb-1">Resource Type</p>
                <p className="font-semibold text-[var(--text)] capitalize">
                  {formData.resourceType}
                </p>
              </div>
              <div className="p-6 bg-[var(--surface-active)] rounded-lg">
                <p className="text-[var(--text-muted)] text-sm mb-1">Quantity</p>
                <p className="font-semibold text-[var(--text)]">{formData.quantity}</p>
              </div>
              <div className="grid lg:grid-2 gap-6">
                <div className="p-6 bg-[var(--surface-active)] rounded-lg">
                  <p className="text-[var(--text-muted)] text-sm mb-1">Price</p>
                  <p className="font-semibold text-[var(--text)]">₹{formData.price}</p>
                </div>
                <div className="p-6 bg-[var(--surface-active)] rounded-lg">
                  <p className="text-[var(--text-muted)] text-sm mb-1">Location</p>
                  <p className="font-semibold text-[var(--text)]">{formData.location}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(3)} className="btn btn-secondary flex-1">
                Back
              </button>
              <button className="btn btn-primary flex-1 gap-2" onClick={handlePublish}>
                <Upload size={18} />
                Publish Listing
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ListResource;
