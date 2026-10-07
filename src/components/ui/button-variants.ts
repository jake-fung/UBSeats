import { cva } from 'class-variance-authority';

export const buttonVariants = cva('inline-flex items-center justify-center transition-all', {
  variants: {
    variant: {
      primary:
        'rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white hover:shadow-md active:bg-primary-hover motion-safe:hover:-translate-y-0.5',
      outline:
        'rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent',
      icon: 'rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});
