import { Check, Home, Users, Wallet } from 'lucide-react';

export type OnboardingStep = 1 | 2 | 3;

interface WelcomeStepperProps {
  currentStep: OnboardingStep;
}

const STEPS: { id: OnboardingStep; label: string; Icon: typeof Home }[] = [
  { id: 1, label: 'משק בית', Icon: Home },
  { id: 2, label: 'בני משפחה', Icon: Users },
  { id: 3, label: 'חשבונות', Icon: Wallet },
];

export default function WelcomeStepper({ currentStep }: WelcomeStepperProps) {
  return (
    <div className="flex items-center justify-center w-full mb-10" dir="rtl">
      {STEPS.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const { Icon } = step;

        return (
          <div key={step.id} className="flex items-center flex-1 max-w-[220px]">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-accent border-accent text-white'
                    : isActive
                      ? 'bg-white border-accent text-accent shadow-md'
                      : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <Check strokeWidth={2} className="w-6 h-6" />
                ) : (
                  <Icon strokeWidth={1.5} className="w-6 h-6" />
                )}
              </div>
              <span
                className={`text-xs font-semibold mt-2 transition-colors ${
                  isActive || isCompleted ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 transition-colors duration-300 -mt-6 ${
                  currentStep > step.id ? 'bg-accent' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
