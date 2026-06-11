import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useCursor, type CursorVariant } from '../context/CursorContext';

const springConfig = { damping: 25, stiffness: 250, mass: 0.5 };

const sizeMap: Record<CursorVariant, number> = {
  default: 24,
  hover: 56,
  text: 4,
  hidden: 0,
};

const borderMap: Record<CursorVariant, string> = {
  default: 'border-2 border-primary-400/60',
  hover: 'border-2 border-primary-400/80 bg-primary-400/10',
  text: 'border-0 bg-primary-400/80',
  hidden: 'border-0',
};

export default function Cursor() {
  const { variant } = useCursor();

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    const leave = () => {
      rawX.set(-100);
      rawY.set(-100);
    };
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);

    document.body.classList.add('custom-cursor');

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.body.classList.remove('custom-cursor');
    };
  }, [rawX, rawY]);

  const size = sizeMap[variant];

  return (
    <motion.div
      style={{
        x,
        y,
        width: size,
        height: size,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: size,
        height: size,
        borderRadius: '50%',
      }}
      className={`cursor-glow ${
        variant === 'hover' ? 'backdrop-blur-md' : 'backdrop-blur-none'
      }`}
      transition={{ duration: 0.15 }}
    >
      <div
        className={`h-full w-full rounded-full transition-colors duration-150 ${borderMap[variant]}`}
      />
    </motion.div>
  );
}
