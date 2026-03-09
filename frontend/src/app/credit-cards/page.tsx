'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiTrash2,
  FiCreditCard,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
} from 'react-icons/fi';

interface Charge {
  id: number;
  amount: number;
  charge_date: string;
  description: string;
}

interface CreditCard {
  id: number;
  last4digits: string;
  charges: Charge[];
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Add card
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [last4digits, setLastFourDigits] = useState('');

  // Add charge
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeDate, setChargeDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [chargeDescription, setChargeDescription] = useState('');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await api.get('/credit-cards');
      setCards(res.data);
    } catch (error) {
      console.error('Error fetching cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!last4digits || last4digits.length !== 4) {
      toast.error('יש להזין 4 ספרות אחרונות');
      return;
    }
    try {
      await api.post('/credit-cards', { last4digits });
      toast.success('הכרטיס נוסף בהצלחה');
      setLastFourDigits('');
      setCardModalOpen(false);
      fetchCards();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בהוספת כרטיס');
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את הכרטיס?')) return;
    try {
      await api.delete(`/credit-cards/${id}`);
      toast.success('הכרטיס נמחק');
      fetchCards();
    } catch {
      toast.error('שגיאה במחיקת הכרטיס');
    }
  };

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeAmount || !selectedCardId) return;
    try {
      await api.post(`/credit-cards/${selectedCardId}/charges`, {
        amount: parseFloat(chargeAmount),
        charge_date: chargeDate,
        description: chargeDescription,
      });
      toast.success('החיוב נוסף בהצלחה');
      setChargeAmount('');
      setChargeDate(new Date().toISOString().split('T')[0]);
      setChargeDescription('');
      setChargeModalOpen(false);
      fetchCards();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'שגיאה בהוספת חיוב');
    }
  };

  const handleDeleteCharge = async (_cardId: number, chargeId: number) => {
    try {
      await api.delete(`/credit-charges/${chargeId}`);
      toast.success('החיוב נמחק');
      fetchCards();
    } catch {
      toast.error('שגיאה במחיקת החיוב');
    }
  };

  const getUrgencyClass = (dateStr: string) => {
    const now = new Date();
    const chargeDate = new Date(dateStr);
    const diffDays = Math.ceil(
      (chargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 3 && diffDays >= 0)
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (diffDays <= 7 && diffDays >= 0)
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  const getUrgencyBadge = (dateStr: string) => {
    const now = new Date();
    const chargeDate = new Date(dateStr);
    const diffDays = Math.ceil(
      (chargeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays <= 3 && diffDays >= 0)
      return (
        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-medium">
          <FiAlertTriangle size={12} />
          בעוד {diffDays} ימים
        </span>
      );
    if (diffDays <= 7 && diffDays >= 0)
      return (
        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          בעוד {diffDays} ימים
        </span>
      );
    return null;
  };

  const sortedCharges = (charges: Charge[]) =>
    [...charges].sort(
      (a, b) =>
        new Date(a.charge_date).getTime() - new Date(b.charge_date).getTime()
    );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 pb-20 lg:pb-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              חיובי אשראי צפויים
            </h1>
            <button
              onClick={() => setCardModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <FiPlus />
              הוסף כרטיס
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : cards.length === 0 ? (
            <div className="card p-12 text-center">
              <FiCreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">לא נמצאו כרטיסי אשראי</p>
              <p className="text-sm text-gray-400 mt-1">
                הוסף כרטיס אשראי כדי להתחיל לעקוב אחר חיובים
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cards.map((card) => (
                <div key={card.id} className="card overflow-hidden animate-fadeIn">
                  {/* Card header */}
                  <div
                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() =>
                      setExpandedCard(
                        expandedCard === card.id ? null : card.id
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white">
                        <FiCreditCard size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          כרטיס **** {card.last4digits}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {card.charges.length} חיובים | סה&quot;כ ₪
                          {card.charges
                            .reduce((s, c) => s + c.amount, 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCardId(card.id);
                          setChargeModalOpen(true);
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
                        title="הוסף חיוב"
                      >
                        <FiPlus size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCard(card.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                        title="מחק כרטיס"
                      >
                        <FiTrash2 size={18} />
                      </button>
                      {expandedCard === card.id ? (
                        <FiChevronUp className="text-gray-400" />
                      ) : (
                        <FiChevronDown className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Charges list */}
                  {expandedCard === card.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
                      {card.charges.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">
                          אין חיובים
                        </p>
                      ) : (
                        sortedCharges(card.charges).map((charge) => (
                          <div
                            key={charge.id}
                            className={`flex items-center justify-between p-4 rounded-lg border ${getUrgencyClass(
                              charge.charge_date
                            )} transition-all`}
                          >
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {charge.description || 'חיוב'}
                              </p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm text-gray-500">
                                  {new Date(
                                    charge.charge_date
                                  ).toLocaleDateString('he-IL')}
                                </span>
                                {getUrgencyBadge(charge.charge_date)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-gray-900 dark:text-white">
                                ₪{charge.amount.toLocaleString()}
                              </span>
                              <button
                                onClick={() =>
                                  handleDeleteCharge(card.id, charge.id)
                                }
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Card Modal */}
          <Modal
            isOpen={cardModalOpen}
            onClose={() => {
              setCardModalOpen(false);
              setLastFourDigits('');
            }}
            title="הוספת כרטיס אשראי"
          >
            <form onSubmit={handleAddCard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  4 ספרות אחרונות
                </label>
                <input
                  type="text"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  value={last4digits}
                  onChange={(e) =>
                    setLastFourDigits(e.target.value.replace(/\D/g, ''))
                  }
                  className="w-full text-center text-2xl tracking-widest"
                  placeholder="0000"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  הוסף
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardModalOpen(false);
                    setLastFourDigits('');
                  }}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
              </div>
            </form>
          </Modal>

          {/* Add Charge Modal */}
          <Modal
            isOpen={chargeModalOpen}
            onClose={() => {
              setChargeModalOpen(false);
              setChargeAmount('');
              setChargeDescription('');
            }}
            title="הוספת חיוב"
          >
            <form onSubmit={handleAddCharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  סכום
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="w-full"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תאריך חיוב
                </label>
                <input
                  type="date"
                  value={chargeDate}
                  onChange={(e) => setChargeDate(e.target.value)}
                  className="w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  תיאור
                </label>
                <input
                  type="text"
                  value={chargeDescription}
                  onChange={(e) => setChargeDescription(e.target.value)}
                  className="w-full"
                  placeholder="תיאור החיוב"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1">
                  הוסף
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setChargeModalOpen(false);
                    setChargeAmount('');
                    setChargeDescription('');
                  }}
                  className="btn-secondary flex-1"
                >
                  ביטול
                </button>
              </div>
            </form>
          </Modal>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
