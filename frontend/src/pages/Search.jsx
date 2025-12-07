import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { Helmet } from 'react-helmet-async'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { blogApi } from '../services/api'
import BlogGrid from '../components/Blog/BlogGrid'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  
  const searchQuery = searchParams.get('q')

  const { data, isLoading, error } = useQuery(
    ['search', searchQuery],
    () => blogApi.searchPosts({ q: searchQuery, limit: 12 }),
    {
      enabled: !!searchQuery,
      staleTime: 2 * 60 * 1000,
    }
  )

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
    }
  }

  useEffect(() => {
    setQuery(searchQuery || '')
  }, [searchQuery])

  return (
    <>
      <Helmet>
        <title>{searchQuery ? `Search: ${searchQuery}` : 'Search'} - CyberSec & IAM Blog</title>
        <meta name="description" content="Search our cybersecurity and IAM articles for specific topics and insights." />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <MagnifyingGlassIcon className="mx-auto h-16 w-16 text-white mb-6" />
              <h1 className="text-4xl font-bold text-white sm:text-5xl">
                Search Articles
              </h1>
              <p className="mt-4 text-xl text-primary-100">
                Find specific security insights and IAM guidance
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {searchQuery ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Search Results for "{searchQuery}"
                </h2>
                {data?.data && (
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Found {data.data.pagination.total} articles
                  </p>
                )}
              </div>
              
              <BlogGrid
                data={data}
                isLoading={isLoading}
                error={error}
                emptyMessage={`No articles found for "${searchQuery}". Try different keywords.`}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                Enter a search term to find articles
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
