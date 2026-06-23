'use client';

import { Book, FileText, Download, Target, TrendingDown, Home, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const RESOURCES = [
  {
    title: 'Step-by-Step Dairy Farming Guide',
    description: 'The ultimate guide to managing a profitable dairy farm from day one.',
    icon: Book,
    color: '#388E3C', // Primary green
    bg: '#E8F5E9',
  },
  {
    title: 'Dairy Business Plan (5 Cows)',
    description: 'A complete financial and operational blueprint for a 5-cow startup farm.',
    icon: FileText,
    color: '#1976D2', // Blue
    bg: '#E3F2FD',
  },
  {
    title: 'Dairy Business Plan (10 Cows)',
    description: 'A scalable business plan for medium-sized dairy operations.',
    icon: Target,
    color: '#F57C00', // Orange
    bg: '#FFF3E0',
  },
  {
    title: 'Dairy Business Plan (20+ Cows)',
    description: 'Advanced templates and strategies for large commercial dairy farms.',
    icon: Target,
    color: '#D32F2F', // Red
    bg: '#FFEBEE',
  },
  {
    title: 'Feed Cost Reduction Strategies',
    description: 'Learn how to formulate your own feeds and reduce costs by up to 30%.',
    icon: TrendingDown,
    color: '#00796B', // Teal
    bg: '#E0F2F1',
  },
  {
    title: 'Cow Shed Designs (Various Sizes)',
    description: 'Architectural layouts and blueprints for zero-grazing and free-stall units.',
    icon: Home,
    color: '#512DA8', // Purple
    bg: '#EDE7F6',
  },
  {
    title: 'Dairy Goat Farming Guide',
    description: 'A bonus guide for diversifying into profitable dairy goat farming.',
    icon: Book,
    color: '#C2185B', // Pink
    bg: '#FCE4EC',
  },
];

export default function ResourcesPage() {
  const handleDownload = (title: string) => {
    // Show a toast message because actual PDFs are not yet provided
    toast(
      (t) => (
        <div className="flex flex-col gap-1">
          <p className="font-bold text-gray-900">Coming Soon!</p>
          <p className="text-sm text-gray-600">The PDF for "{title}" is being updated and will be available to download shortly.</p>
        </div>
      ),
      {
        icon: 'ℹ️',
        duration: 4000,
        style: {
          background: '#fff',
          border: '1px solid #E2E8E2',
          padding: '16px',
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div 
        className="rounded-2xl p-8 relative overflow-hidden text-white"
        style={{
          background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
          boxShadow: '0 10px 30px rgba(27, 94, 32, 0.2)',
        }}
      >
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Book className="w-64 h-64" />
        </div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4" style={{ background: 'rgba(255,255,255,0.2)' }}>
            🎁 FREE BONUS
          </div>
          <h1 className="text-3xl font-extrabold mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Dairy Farming Success Bundle
          </h1>
          <p className="text-green-50 text-lg opacity-90 leading-relaxed">
            You're not just getting a tool — you're getting the full system to run a profitable dairy farm. Access your step-by-step guides, business plan templates, and cost-reduction strategies below.
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {RESOURCES.map((resource, i) => {
          const Icon = resource.icon;
          return (
            <div 
              key={i} 
              className="card p-6 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl border-t-4"
              style={{ borderTopColor: resource.color }}
            >
              <div>
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: resource.bg, color: resource.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1A2E', fontFamily: 'Outfit, sans-serif' }}>
                  {resource.title}
                </h3>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#64748B' }}>
                  {resource.description}
                </p>
              </div>

              <button
                onClick={() => handleDownload(resource.title)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  background: '#F8FAF8',
                  color: resource.color,
                  border: `1px solid ${resource.bg}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = resource.bg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#F8FAF8';
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>
          );
        })}
      </div>

      {/* Support Callout */}
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-4">
        <div className="mt-1 bg-blue-100 p-2 rounded-full text-blue-600">
          <ExternalLink className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900">Need more specific advice?</h4>
          <p className="text-sm text-blue-800 mt-1">Our team of agronomists and veterinary experts are available for premium consulting. If you need a customized business plan for an enterprise scale farm, please reach out to support.</p>
        </div>
      </div>
    </div>
  );
}
