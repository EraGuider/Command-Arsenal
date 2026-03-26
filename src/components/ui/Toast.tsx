import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const Toast: React.FC = () => {
  const { toastMessage } = useAppContext();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-12 left-1/2 z-[100] min-w-[250px] bg-stone-800 text-white text-center rounded-xl px-4 py-3 shadow-xl font-medium"
        >
          {toastMessage}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
