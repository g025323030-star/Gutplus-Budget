import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import type { Account, FamilyMember } from '@gutplus/shared';
import { useAuth } from '../context/AuthContext';
import { listFamilyMembers } from '../services/family-members.service';
import { listAccounts } from '../services/accounts.service';
import { completeOnboarding } from '../services/user.service';
import WelcomeStepper, {
  type OnboardingStep,
} from '../components/welcome/WelcomeStepper';
import HouseholdStep from '../components/welcome/HouseholdStep';
import FamilyMembersStep from '../components/welcome/FamilyMembersStep';
import AccountsStep from '../components/welcome/AccountsStep';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { householdId, refreshUserStatus } = useAuth();
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [initialAccounts, setInitialAccounts] = useState<Account[]>([]);
  const [initialMembers, setInitialMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    const resolveStep = async () => {
      if (!householdId) {
        if (!cancelled) setCurrentStep(1);
        return;
      }
      try {
        const [members, accounts] = await Promise.all([
          listFamilyMembers(householdId),
          listAccounts(householdId),
        ]);
        if (cancelled) return;
        setInitialMembers(members);
        setInitialAccounts(accounts);
        if (members.length === 0) {
          setCurrentStep(2);
        } else {
          setCurrentStep(3);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setCurrentStep(2);
      }
    };
    resolveStep();
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  const handleFinish = async () => {
    await completeOnboarding();
    await refreshUserStatus();
    navigate('/snapshot', { replace: true });
  };

  if (currentStep === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-slate-400">טוען</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-8"
      dir="rtl"
    >
      <div className="bg-surface rounded-2xl shadow-sm w-full max-w-2xl p-6 sm:p-10">
        <WelcomeStepper currentStep={currentStep} />

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <HouseholdStep
              key="step-1"
              onComplete={() => setCurrentStep(2)}
            />
          )}
          {currentStep === 2 && (
            <FamilyMembersStep
              key="step-2"
              initialMembers={initialMembers}
              onComplete={() => setCurrentStep(3)}
              onSkip={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 3 && (
            <AccountsStep
              key="step-3"
              initialAccounts={initialAccounts}
              onFinish={handleFinish}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
