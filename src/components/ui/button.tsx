import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils/cnUtils';
import { buttonVariants } from './button-variants';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, type = 'button', ...props }, ref) => (
  <button ref={ref} type={type} className={cn(buttonVariants({ variant }), className)} {...props} />
));
Button.displayName = 'Button';

export { Button, type ButtonProps };
