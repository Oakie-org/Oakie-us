import React, { useState } from 'react';
import { X, Plus, FileInput, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import styles from './CreateProjectModal.module.css';

interface CreateProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Step = 'selection' | 'form';

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<Step>('selection');

    // Form State
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagsInput, setTagsInput] = useState('');

    if (!isOpen) return null;

    const handleBack = () => {
        if (step === 'form') {
            setStep('selection');
        } else {
            onClose();
        }
    };

    const handlePublish = () => {
        const tagsArray = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        // Mock API call
        console.log('Publishing Project:', { title, subtitle, description, tags: tagsArray });
        // Reset and close
        setTitle('');
        setSubtitle('');
        setDescription('');
        setTagsInput('');
        setStep('selection');
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {step === 'form' && (
                            <button className={styles.closeBtn} onClick={handleBack} style={{ marginRight: 16 }}>
                                <ChevronLeft size={24} />
                            </button>
                        )}
                        <span className={styles.headerTitle}>
                            {step === 'selection' ? 'Create/add project page' : 'Create New Project'}
                        </span>
                    </div>



                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {step === 'selection' ? (
                        <div className={styles.selectionGrid}>
                            <div className={styles.optionCard} onClick={() => setStep('form')}>
                                <div className={styles.iconCircle}>
                                    <Plus size={32} />
                                </div>
                                <div className={styles.optionLabel}>New Project</div>
                                <div className={styles.optionDesc}>Create project from scratch</div>
                            </div>

                            <div className={`${styles.optionCard} ${styles.disabled}`}>
                                <div className={styles.iconCircle}>
                                    <FileInput size={32} />
                                </div>
                                <div className={styles.optionLabel}>Import Project</div>
                                <div className={styles.optionDesc}>Upload/drop your project file</div>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.formContainer}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Add Picture/Thumbnail</label>
                                <div className={styles.imageUploadRow}>
                                    <div className={styles.uploadBox}>
                                        <ImageIcon size={32} />
                                    </div>
                                    <div className={styles.uploadBox}>
                                        <Plus size={32} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    className={styles.titleInput}
                                    placeholder="Add title here"
                                    maxLength={20}
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                />
                                <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>
                                    {title.length}/20
                                </div>
                            </div>

                            <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    className={styles.titleInput}
                                    style={{ fontSize: '1.125rem', fontWeight: 500, borderBottom: '1px solid #E5E7EB', paddingBottom: '8px' }}
                                    placeholder="One-sentence introduction (Subtitle)..."
                                    maxLength={60}
                                    value={subtitle}
                                    onChange={e => setSubtitle(e.target.value)}
                                />
                                <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>
                                    {subtitle.length}/60
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <textarea
                                    className={styles.textArea}
                                    placeholder="Add detailed content here..."
                                    maxLength={1000}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                                <div style={{ textAlign: 'right', fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>
                                    {description.length}/1000
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <input
                                    type="text"
                                    className={styles.titleInput}
                                    style={{ fontSize: '1rem', borderBottom: '1px solid #E5E7EB' }}
                                    placeholder="Add tags (separated by comma)..."
                                    value={tagsInput}
                                    onChange={e => setTagsInput(e.target.value)}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                                    {tagsInput.split(',').map((tag, i) => tag.trim() && (
                                        <span key={i} style={{
                                            background: '#EFF6FF',
                                            color: '#2563EB',
                                            padding: '4px 12px',
                                            borderRadius: '16px',
                                            fontSize: '12px',
                                            fontWeight: 500
                                        }}>
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <button className={styles.publishBtn} onClick={handlePublish}>
                                Publish Project!
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
