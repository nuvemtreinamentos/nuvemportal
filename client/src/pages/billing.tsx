import { useAuth } from "@/hooks/use-auth";
import { plans } from "@/lib/plans";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    pixQrCode: string;
    pixKey: string;
    amount: number;
  } | null>(null);

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Faça login para assinar um plano",
        variant: "destructive",
      });
      return;
    }

    try {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, amount: plan.price }),
      });

      if (!response.ok) {
        throw new Error("Falha ao criar pagamento");
      }

      const paymentDetails = await response.json();
      setPaymentDetails(paymentDetails);
      setSelectedPlan(planId);
      setIsPaymentModalOpen(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível processar o pagamento",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Planos e Preços</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para sua jornada de aprendizado em programação e
            inglês
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="relative flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-2xl font-bold">
                  R$ {(plan.price / 100).toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /mês
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.id === selectedPlan ? "secondary" : "default"}
                >
                  Assinar Plano
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pagamento via PIX</DialogTitle>
              <DialogDescription>
                Escaneie o QR Code abaixo ou copie a chave PIX para realizar o
                pagamento
              </DialogDescription>
            </DialogHeader>

            {paymentDetails && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={paymentDetails.pixQrCode}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium mb-2">
                    Valor: R$ {(paymentDetails.amount / 100).toFixed(2)}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentDetails.pixKey);
                      toast({
                        title: "Chave PIX copiada",
                        description: "Cole no seu aplicativo de pagamento",
                      });
                    }}
                  >
                    Copiar Chave PIX
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
