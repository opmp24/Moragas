import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

const letterVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.03, duration: 0.3, ease: 'easeOut' as const },
  }),
};

interface FillTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export default function FillText({ text, className = '', as: Tag = 'h2' }: FillTextProps) {
  return (
    <Tag className={className}>
      {text.split('').map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          className="inline-block"
          custom={i}
          variants={letterVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </Tag>
  );
}
