import { Helmet } from 'react-helmet-async'

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service - CyberSec & IAM Blog</title>
        <meta name="description" content="Terms of Service for CyberSec & IAM Blog" />
      </Helmet>

      <div className="bg-white dark:bg-gray-900 min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg dark:prose-dark max-w-none text-left">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Acceptance of Terms
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                By accessing and using this blog, you accept and agree to be bound by the terms and 
                provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Use License
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Permission is granted to temporarily access the materials on this blog for personal, 
                non-commercial transitory viewing only. This is the grant of a license, not a transfer 
                of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside mb-4 ml-0 pl-4 text-left">
                <li className="text-gray-700 dark:text-gray-300 mb-2">Modify or copy the materials</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Use the materials for any commercial purpose</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Remove any copyright or other proprietary notations</li>
                <li className="text-gray-700 dark:text-gray-300 mb-2">Transfer the materials to another person</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Disclaimer
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The materials on this blog are provided on an 'as is' basis. We make no warranties, 
                expressed or implied, and hereby disclaim and negate all other warranties including, 
                without limitation, implied warranties or conditions of merchantability, fitness for 
                a particular purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Limitations
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                In no event shall we or our suppliers be liable for any damages (including, without 
                limitation, damages for loss of data or profit, or due to business interruption) arising 
                out of the use or inability to use the materials on this blog.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Accuracy of Materials
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The materials appearing on this blog could include technical, typographical, or 
                photographic errors. We do not warrant that any of the materials on its website are 
                accurate, complete, or current.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                Modifications
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may revise these terms of service at any time without notice. By using this blog, 
                you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}










