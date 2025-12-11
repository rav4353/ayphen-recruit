import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { skillsApi } from '../../lib/api';
import { cn } from '../../lib/utils'; // Assuming you have a utils file for class merging, or use clsx/tailwind-merge directly

interface Skill {
    id: string;
    name: string;
    category?: string;
}

interface SkillSelectorProps {
    value: string[];
    onChange: (skills: string[]) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    className?: string;
}

export function SkillSelector({
    value = [],
    onChange,
    placeholder = 'Select skills...',
    label,
    error,
    className,
}: SkillSelectorProps) {
    const [inputValue, setInputValue] = useState('');
    const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchSkills = async () => {
            setIsLoading(true);
            try {
                const res = await skillsApi.getAll();
                setAvailableSkills(res.data.data || res.data);
            } catch (err) {
                console.error('Failed to fetch skills', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSkills();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRemoveSkill = (skillToRemove: string) => {
        onChange(value.filter((s) => s !== skillToRemove));
    };

    const handleAddSkill = (skillName: string) => {
        const trimmed = skillName.trim();
        if (!trimmed) return;

        // Check if already selected (case-insensitive)
        if (value.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            setInputValue('');
            return;
        }

        onChange([...value, trimmed]);
        setInputValue('');
    };

    const filteredSkills = availableSkills.filter((skill) =>
        skill.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !value.some((v) => v.toLowerCase() === skill.name.toLowerCase())
    );

    const showAddNew = inputValue && !filteredSkills.some(s => s.name.toLowerCase() === inputValue.toLowerCase());

    return (
        <div className={cn("w-full", className)} ref={wrapperRef}>
            {label && (
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                    {label}
                </label>
            )}

            <div
                className={cn(
                    "relative min-h-[42px] px-3 py-2 bg-white dark:bg-neutral-900 border rounded-lg transition-all",
                    "focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500",
                    error ? "border-red-500" : "border-neutral-200 dark:border-neutral-700"
                )}
                onClick={() => setIsOpen(true)}
            >
                <div className="flex flex-wrap gap-2">
                    {value.map((skill) => (
                        <span
                            key={skill}
                            className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800"
                        >
                            {skill}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSkill(skill);
                                }}
                                className="ml-1 hover:text-blue-900 dark:hover:text-blue-100"
                            >
                                <X size={14} />
                            </button>
                        </span>
                    ))}

                    <input
                        type="text"
                        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-neutral-900 dark:text-white placeholder-neutral-400"
                        placeholder={value.length === 0 ? placeholder : ''}
                        value={inputValue}
                        onChange={(e) => {
                            setInputValue(e.target.value);
                            setIsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && inputValue) {
                                e.preventDefault();
                                handleAddSkill(inputValue);
                            }
                            if (e.key === 'Backspace' && !inputValue && value.length > 0) {
                                handleRemoveSkill(value[value.length - 1]);
                            }
                        }}
                    />
                </div>

                {/* Dropdown */}
                {isOpen && (inputValue || filteredSkills.length > 0) && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-3 text-center text-sm text-neutral-500">Loading skills...</div>
                        ) : (
                            <>
                                {filteredSkills.map((skill) => (
                                    <button
                                        key={skill.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between group"
                                        onClick={() => handleAddSkill(skill.name)}
                                    >
                                        <span>{skill.name}</span>
                                        {skill.category && (
                                            <span className="text-xs text-neutral-400 group-hover:text-neutral-500">
                                                {skill.category}
                                            </span>
                                        )}
                                    </button>
                                ))}

                                {showAddNew && (
                                    <button
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-2"
                                        onClick={() => handleAddSkill(inputValue)}
                                    >
                                        <Plus size={14} />
                                        Create "{inputValue}"
                                    </button>
                                )}

                                {filteredSkills.length === 0 && !showAddNew && (
                                    <div className="p-3 text-center text-sm text-neutral-500">
                                        No matching skills found
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>
    );
}
