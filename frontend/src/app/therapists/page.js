"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { therapistService } from '@/services/therapistService';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';
import toast from 'react-hot-toast';
import { ArrowRight, Search, Star, BadgeCheck } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0/hr';
  }

  return `$${value}/hr`;
}

function normalizeTherapistsResponse(payload) {
  if (!payload || typeof payload !== 'object') return [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.therapists)) return payload.therapists;
  if (Array.isArray(payload.data?.therapists)) return payload.data.therapists;

  return [];
}

function getTherapistUser(therapist) {
  const userIdAsObject = therapist?.userId && typeof therapist.userId === 'object'
    ? therapist.userId
    : null;
  return therapist?.user || userIdAsObject || null;
}

function getTherapistId(therapist) {
  if (!therapist) return null;
  if (therapist._id) return therapist._id;
  if (typeof therapist.userId === 'string') return therapist.userId;
  if (therapist.userId?._id) return therapist.userId._id;
  return null;
}

function TherapistCard({ therapist, index }) {
  const user = getTherapistUser(therapist);
  const therapistId = getTherapistId(therapist);
  const name = user?.fullName || therapist?.fullName || 'Therapist';
  const rating = typeof therapist?.rating === 'number' ? therapist.rating.toFixed(1) : '0.0';
  const price = formatPrice(therapist?.hourlyRate);
  const reviewCount = therapist?.totalReviews || 0;
  const isVerified = therapist?.isVerified === true;
  const specializations = Array.isArray(therapist?.specializations)
    ? therapist.specializations
    : [];

  return (
    <motion.article
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="group rounded-card border border-border-light bg-white p-6 shadow-card-soft transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <Avatar
          src={user?.avatarUrl || therapist?.photoUrl}
          name={name}
          size={64}
          className="ring-2 ring-brand/10"
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-xl font-bold text-text-dark">{name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand">
              <Star className="h-3.5 w-3.5 fill-current" />
              {rating}
            </span>
            <span>{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
            <span className="text-border-light">|</span>
            <span className="font-semibold text-text-dark">{price}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {specializations.length > 0 ? (
          <>
            {specializations.slice(0, 3).map((spec) => (
              <span
                key={`${therapist?._id}-${spec}`}
                className="rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand"
              >
                {spec}
              </span>
            ))}
            {specializations.length > 3 && (
              <span className="rounded-full border border-border-light bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
                +{specializations.length - 3} more
              </span>
            )}
          </>
        ) : (
          <span className="rounded-full border border-border-light bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
            General counseling
          </span>
        )}
      </div>

      <p className="mt-4 min-h-[48px] text-sm leading-relaxed text-text-secondary">
        {user?.bio || therapist?.bio || 'Experienced and compassionate therapist focused on practical, client-centered support.'}
      </p>

      <div className="mt-6 flex items-center justify-between">
        {isVerified ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
            <BadgeCheck className="h-4 w-4" />
            Verified profile
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
            Licensed therapist
          </span>
        )}

        {therapistId && (
          <Link
            href={`/therapists/${therapistId}`}
            className="inline-flex items-center gap-2 rounded-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            View Profile
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </motion.article>
  );
}

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await therapistService.getTherapists();
      setTherapists(normalizeTherapistsResponse(response));
    } catch (err) {
      setError('Failed to load therapists. Please try again.');
      toast.error('Failed to load therapists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTherapists();
  }, []);

  const filteredTherapists = therapists.filter((therapist) => {
    const user = getTherapistUser(therapist);
    const name = (user?.fullName || therapist?.fullName || '').toLowerCase();
    const bio = (user?.bio || therapist?.bio || '').toLowerCase();
    const specs = Array.isArray(therapist?.specializations)
      ? therapist.specializations.join(' ').toLowerCase()
      : '';
    const q = search.trim().toLowerCase();

    if (!q) {
      return true;
    }

    return name.includes(q) || bio.includes(q) || specs.includes(q);
  });

  return (
    <div className="min-h-screen bg-brand-soft/40">
      <section className="bg-brand-gradient px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl"
          >
            Find Your Therapist
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-4 max-w-2xl text-lg text-white/90"
          >
            Browse licensed professionals, compare experience and pricing, and choose the support that fits you best.
          </motion.p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 rounded-card border border-border-light bg-white p-4 shadow-card-soft">
            <label htmlFor="therapist-search" className="mb-2 block text-sm font-semibold text-text-dark">
              Search therapists by name, bio, or specialization
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                id="therapist-search"
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Try: anxiety, relationships, trauma..."
                className="w-full rounded-brand border border-border-light py-2.5 pl-10 pr-3 text-sm text-text-dark placeholder:text-text-secondary/80 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-20">
              <LoadingSpinner label="Loading therapists..." />
            </div>
          )}

          {error && (
            <div className="rounded-card border border-red-200 bg-red-50 p-8 text-center shadow-sm">
              <p className="font-medium text-red-800">{error}</p>
              <button
                type="button"
                onClick={fetchTherapists}
                className="mt-4 inline-flex items-center rounded-brand bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && therapists.length === 0 && (
            <div className="rounded-card border border-border-light bg-white p-12 text-center shadow-card-soft">
              <div className="mb-4 text-5xl">👩‍⚕️</div>
              <h2 className="mb-2 text-2xl font-bold text-text-dark">
                No Therapists Available Yet
              </h2>
              <p className="mb-6 text-text-secondary">
                Be the first to join our network as a therapist!
              </p>
              <Link
                href="/register"
                className="inline-flex items-center rounded-brand bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Register as Therapist
              </Link>
            </div>
          )}

          {!loading && !error && therapists.length > 0 && filteredTherapists.length > 0 && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTherapists.map((therapist, index) => (
                <TherapistCard key={getTherapistId(therapist) || `${index}`} therapist={therapist} index={index} />
              ))}
            </div>
          )}

          {!loading && !error && therapists.length > 0 && filteredTherapists.length === 0 && (
            <div className="rounded-card border border-border-light bg-white p-10 text-center shadow-card-soft">
              <h2 className="text-xl font-bold text-text-dark">No therapists match your search</h2>
              <p className="mt-2 text-text-secondary">Try a different keyword or remove filters.</p>
              <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 inline-flex items-center rounded-brand bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Clear Search
              </button>
            </div>
          )}

          {!loading && !error && therapists.length > 0 && (
            <div className="mt-8 text-center text-sm text-text-secondary">
              <p>
                Showing {filteredTherapists.length} of {therapists.length} therapist{therapists.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
