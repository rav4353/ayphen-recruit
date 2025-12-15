'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  Search,
  Filter,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  MapPin,
  Tag,
  Loader2,
  User,
  Mail,
  Building,
  Star,
} from 'lucide-react';
import { candidateSearchApi } from '@/lib/api';

function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

interface SearchFilters {
  query: string;
  skills: string[];
  skillsMatch: 'ALL' | 'ANY';
  locations: string[];
  companies: string[];
  titles: string[];
  sources: string[];
  tags: string[];
  createdAfter: string;
  createdBefore: string;
  hasApplications?: boolean;
  sortBy: 'relevance' | 'createdAt' | 'updatedAt' | 'name';
  sortOrder: 'asc' | 'desc';
}

const defaultFilters: SearchFilters = {
  query: '',
  skills: [],
  skillsMatch: 'ANY',
  locations: [],
  companies: [],
  titles: [],
  sources: [],
  tags: [],
  createdAfter: '',
  createdBefore: '',
  hasApplications: undefined,
  sortBy: 'relevance',
  sortOrder: 'desc',
};

interface AdvancedSearchProps {
  onSelectCandidate?: (candidate: any) => void;
}

export function AdvancedSearch({ onSelectCandidate }: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [page, setPage] = useState(1);
  const [inputValue, setInputValue] = useState('');

  const { data: searchResults, isLoading, refetch } = useQuery({
    queryKey: ['candidate-search', filters, page],
    queryFn: () => candidateSearchApi.search({ ...filters, page, limit: 20 }),
    enabled: filters.query.length > 0 || filters.skills.length > 0 || filters.locations.length > 0,
  });

  const { data: savedSearches } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: () => candidateSearchApi.getSavedSearches(),
  });

  const { data: suggestions } = useQuery({
    queryKey: ['search-suggestions', inputValue],
    queryFn: () => candidateSearchApi.getSuggestions(inputValue),
    enabled: inputValue.length >= 2,
  });

  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setFilters(f => ({ ...f, query: value }));
      setPage(1);
    }, 300),
    []
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    debouncedSetQuery(value);
  };

  const addFilter = (type: keyof SearchFilters, value: string) => {
    if (Array.isArray(filters[type])) {
      const arr = filters[type] as string[];
      if (!arr.includes(value)) {
        setFilters({ ...filters, [type]: [...arr, value] });
        setPage(1);
      }
    }
  };

  const removeFilter = (type: keyof SearchFilters, value: string) => {
    if (Array.isArray(filters[type])) {
      setFilters({
        ...filters,
        [type]: (filters[type] as string[]).filter(v => v !== value),
      });
      setPage(1);
    }
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    setInputValue('');
    setPage(1);
  };

  const loadSavedSearch = (search: any) => {
    setFilters({ ...defaultFilters, ...search.query });
    setInputValue(search.query?.query || '');
    setPage(1);
  };

  const results = searchResults?.data;
  const candidates = results?.candidates || [];
  const total = results?.total || 0;
  const facets = results?.facets;

  const hasActiveFilters = filters.query || filters.skills.length > 0 || 
    filters.locations.length > 0 || filters.companies.length > 0 || 
    filters.tags.length > 0;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search candidates... (use AND, OR, NOT for boolean search)"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {(suggestions?.data?.length ?? 0) > 0 && inputValue.length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                {suggestions?.data?.map((suggestion: string) => (
                  <div
                    key={suggestion}
                    className="px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer text-sm"
                    onClick={() => {
                      setInputValue(suggestion);
                      setFilters(f => ({ ...f, query: suggestion }));
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
            {filters.skills.map(skill => (
              <Badge key={skill} variant="primary" className="flex items-center gap-1">
                Skill: {skill}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('skills', skill)} />
              </Badge>
            ))}
            {filters.locations.map(loc => (
              <Badge key={loc} variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {loc}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('locations', loc)} />
              </Badge>
            ))}
            {filters.companies.map(company => (
              <Badge key={company} variant="outline" className="flex items-center gap-1">
                <Building className="h-3 w-3" /> {company}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('companies', company)} />
              </Badge>
            ))}
            {filters.tags.map(tag => (
              <Badge key={tag} variant="warning" className="flex items-center gap-1">
                <Tag className="h-3 w-3" /> {tag}
                <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter('tags', tag)} />
              </Badge>
            ))}
          </div>
        )}

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Skills
                </label>
                <Input
                  placeholder="Add skill and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addFilter('skills', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-neutral-500">
                    <input
                      type="radio"
                      name="skillsMatch"
                      checked={filters.skillsMatch === 'ANY'}
                      onChange={() => setFilters({ ...filters, skillsMatch: 'ANY' })}
                      className="mr-1"
                    />
                    Match Any
                  </label>
                  <label className="text-xs text-neutral-500">
                    <input
                      type="radio"
                      name="skillsMatch"
                      checked={filters.skillsMatch === 'ALL'}
                      onChange={() => setFilters({ ...filters, skillsMatch: 'ALL' })}
                      className="mr-1"
                    />
                    Match All
                  </label>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Location
                </label>
                <Input
                  placeholder="Add location and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addFilter('locations', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Company
                </label>
                <Input
                  placeholder="Add company and press Enter"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      addFilter('companies', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Created After
                </label>
                <Input
                  type="date"
                  value={filters.createdAfter}
                  onChange={(e) => setFilters({ ...filters, createdAfter: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Created Before
                </label>
                <Input
                  type="date"
                  value={filters.createdBefore}
                  onChange={(e) => setFilters({ ...filters, createdBefore: e.target.value })}
                />
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Sort By
                </label>
                <select
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-sm"
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as any })}
                >
                  <option value="relevance">Relevance</option>
                  <option value="createdAt">Date Added</option>
                  <option value="updatedAt">Last Updated</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowSaveModal(true)}>
                <Save className="h-4 w-4 mr-1" />
                Save Search
              </Button>
              <Button size="sm" onClick={() => refetch()}>
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Results and Facets */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Facets Sidebar */}
        {facets && (
          <div className="space-y-4">
            {/* Saved Searches */}
            {(savedSearches?.data?.length ?? 0) > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Saved Searches</h4>
                <div className="space-y-2">
                  {savedSearches?.data?.slice(0, 5).map((search: any) => (
                    <div
                      key={search.id}
                      className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                      onClick={() => loadSavedSearch(search)}
                    >
                      <p className="text-sm font-medium">{search.name}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Skills Facet */}
            {facets.skills?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Skills</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {facets.skills.map((f: any) => (
                    <div
                      key={f.value}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-1 rounded"
                      onClick={() => addFilter('skills', f.value)}
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">{f.value}</span>
                      <Badge variant="outline" className="text-xs">{f.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Locations Facet */}
            {facets.locations?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Locations</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {facets.locations.map((f: any) => (
                    <div
                      key={f.value}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-1 rounded"
                      onClick={() => addFilter('locations', f.value)}
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">{f.value}</span>
                      <Badge variant="outline" className="text-xs">{f.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Sources Facet */}
            {facets.sources?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-medium text-neutral-900 dark:text-white mb-3">Sources</h4>
                <div className="space-y-1">
                  {facets.sources.map((f: any) => (
                    <div
                      key={f.value}
                      className="flex items-center justify-between text-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800 p-1 rounded"
                      onClick={() => addFilter('sources', f.value)}
                    >
                      <span className="text-neutral-700 dark:text-neutral-300">{f.value}</span>
                      <Badge variant="outline" className="text-xs">{f.count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Results */}
        <div className={facets ? 'lg:col-span-3' : 'lg:col-span-4'}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : candidates.length === 0 ? (
            <Card className="p-12 text-center">
              <Search className="h-12 w-12 mx-auto text-neutral-400 mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                {hasActiveFilters ? 'No candidates found' : 'Start searching'}
              </h3>
              <p className="text-neutral-500">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search query'
                  : 'Enter a search query or add filters to find candidates'}
              </p>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-neutral-500">
                  Found <span className="font-medium text-neutral-900 dark:text-white">{total}</span> candidates
                </p>
              </div>

              <div className="space-y-3">
                {candidates.map((candidate: any) => (
                  <Card
                    key={candidate.id}
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => onSelectCandidate?.(candidate)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900 dark:text-white">
                            {candidate.firstName} {candidate.lastName}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {candidate.currentTitle} {candidate.currentCompany && `at ${candidate.currentCompany}`}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {candidate.email}
                            </span>
                            {candidate.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {candidate.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {candidate.applications?.length > 0 && (
                        <div className="text-right">
                          <Badge variant="secondary">
                            {candidate.applications.length} application{candidate.applications.length > 1 ? 's' : ''}
                          </Badge>
                          {candidate.applications[0]?.matchScore && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-neutral-500">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {candidate.applications[0].matchScore}% match
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {candidate.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {candidate.skills.slice(0, 5).map((skill: string) => (
                          <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                        ))}
                        {candidate.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{candidate.skills.length - 5}</Badge>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {total > 20 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-500">
                    Page {page} of {Math.ceil(total / 20)}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= Math.ceil(total / 20)}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        filters={filters}
      />
    </div>
  );
}

function SaveSearchModal({ isOpen, onClose, filters }: { isOpen: boolean; onClose: () => void; filters: SearchFilters }) {
  const [name, setName] = useState('');

  const saveMutation = useMutation({
    mutationFn: () => candidateSearchApi.saveSearch(name, filters as any),
    onSuccess: () => {
      onClose();
      setName('');
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Save Search">
      <div className="space-y-4">
        <Input
          label="Search Name"
          placeholder="e.g., Senior React Developers in NYC"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => saveMutation.mutate()}
            isLoading={saveMutation.isPending}
            disabled={!name}
          >
            Save Search
          </Button>
        </div>
      </div>
    </Modal>
  );
}
