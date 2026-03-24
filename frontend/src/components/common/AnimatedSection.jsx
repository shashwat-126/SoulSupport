"use client";

import { motion } from 'framer-motion';

export function AnimatedSection({ 
  children, 
  title,
  subtitle,
  className = '',
  ...props 
}) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={containerVariants}
      className={`space-y-6 ${className}`}
      {...props}
    >
      {(title || subtitle) && (
        <motion.div variants={itemVariants} className="space-y-2">
          {title && (
            <h2 className="font-heading text-3xl font-bold text-charcoal">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-slate-600">
              {subtitle}
            </p>
          )}
        </motion.div>
      )}
      <motion.div variants={itemVariants}>
        {children}
      </motion.div>
    </motion.section>
  );
}
