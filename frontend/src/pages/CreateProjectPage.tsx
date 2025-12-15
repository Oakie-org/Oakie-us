import React, { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileInput, Image as ImageIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { createProject } from "@/lib/api";

import styles from "./CreateProjectPage.module.css";

type Step = "selection" | "form";

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("selection");
  const titleId = useId();
  const subtitleId = useId();
  const descriptionId = useId();
  const tagsId = useId();

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const handleBack = () => {
    if (step === "form") {
      setStep("selection");
    } else {
      navigate(-1);
    }
  };

  const handlePublish = async () => {
    if (isPublishing) return;
    const tagsArray = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setIsPublishing(true);
    try {
      const created = await createProject({
        title,
        subtitle,
        description,
        tags: tagsArray,
      });
      setTitle("");
      setSubtitle("");
      setDescription("");
      setTagsInput("");
      setStep("selection");
      navigate(`/projects/${created.id}`);
    } catch (error) {
      console.error(error);
      navigate("/explore");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={styles.backBtn}
          aria-label="Back"
          onClick={handleBack}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className={styles.headerTitle}>
          {step === "selection" ? "Create New Project" : "Project Details"}
        </h1>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {step === "selection" ? (
          <div className={styles.selectionGrid}>
            <Card className={styles.optionCard} onClick={() => setStep("form")}>
              <div className={styles.iconCircle}>
                <Plus size={32} />
              </div>
              <div className={styles.optionLabel}>New Project</div>
              <div className={styles.optionDesc}>
                Create project from scratch
              </div>
            </Card>

            <Card className={`${styles.optionCard} ${styles.disabled}`}>
              <div className={styles.iconCircle}>
                <FileInput size={32} />
              </div>
              <div className={styles.optionLabel}>Import Project</div>
              <div className={styles.optionDesc}>
                Upload/drop your project file
              </div>
            </Card>
          </div>
        ) : (
          <Card className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <Label className={styles.label}>Add Picture/Thumbnail</Label>
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
              <Label htmlFor={titleId} className={styles.label}>
                Project Title
              </Label>
              <Input
                id={titleId}
                type="text"
                className={styles.titleInput}
                placeholder="Add title here"
                maxLength={20}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <div className={styles.charCount}>{title.length}/20</div>
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor={subtitleId} className={styles.label}>
                Subtitle
              </Label>
              <Input
                id={subtitleId}
                type="text"
                className={styles.subtitleInput}
                placeholder="One-sentence introduction..."
                maxLength={60}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
              <div className={styles.charCount}>{subtitle.length}/60</div>
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor={descriptionId} className={styles.label}>
                Description
              </Label>
              <Textarea
                id={descriptionId}
                className={styles.textArea}
                placeholder="Add detailed content here..."
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className={styles.charCount}>{description.length}/1000</div>
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor={tagsId} className={styles.label}>
                Tags
              </Label>
              <Input
                id={tagsId}
                type="text"
                className={styles.tagsInput}
                placeholder="Add tags (separated by comma)..."
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
              <div className={styles.tagsPreview}>
                {tagsInput.split(",").map(
                  (tag, i) =>
                    tag.trim() && (
                      <span key={i} className={styles.tagChip}>
                        #{tag.trim()}
                      </span>
                    ),
                )}
              </div>
            </div>

            <Button
              type="button"
              className={styles.publishBtn}
              onClick={handlePublish}
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish Project!"}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreateProjectPage;
