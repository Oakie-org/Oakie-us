import React, { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import styles from "./SmartFilterBar.module.css";

interface SmartFilterBarProps {
  show: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedCity: string;
  onCityChange: (value: string) => void;
  selectedUni: string;
  onUniChange: (value: string) => void;
  categories: string[];
  cities: string[];
  universities: string[];
}

export const SmartFilterBar: React.FC<SmartFilterBarProps> = ({
  show,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCity,
  onCityChange,
  selectedUni,
  onUniChange,
  categories,
  cities,
  universities,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedCity !== "All" ||
    selectedUni !== "All";

  const clearFilters = () => {
    onCategoryChange("All");
    onCityChange("All");
    onUniChange("All");
  };

  return (
    <motion.div
      className={styles.filterContainer}
      initial={{ y: -20, opacity: 0 }}
      animate={{
        y: show ? 0 : -20,
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
      }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={styles.glassPill}>
        {/* Search Section */}
        <div className={styles.searchSection}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.divider} />

        {/* Filter Toggle */}
        <div className={styles.actionsSection}>
          <Button
            variant="ghost"
            size="sm"
            className={`${styles.filterToggle} ${
              isExpanded ? styles.active : ""
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter size={16} />
            <span>Advanced Filter</span>
            {hasActiveFilters && <div className={styles.activeDot} />}
            <ChevronDown
              size={14}
              className={`${styles.chevron} ${isExpanded ? styles.rotate : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className={styles.advancedPanel}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={styles.panelContent}>
              <div className={styles.selectGroup}>
                <label className={styles.label}>Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={onCategoryChange}
                >
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "All" ? "All Categories" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.label}>City</label>
                <Select value={selectedCity} onValueChange={onCityChange}>
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c === "All" ? "All Cities" : c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.selectGroup}>
                <label className={styles.label}>University</label>
                <Select value={selectedUni} onValueChange={onUniChange}>
                  <SelectTrigger className={styles.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u === "All" ? "All Universities" : u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className={styles.clearBtn}
                >
                  <X size={14} /> Clear All
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
