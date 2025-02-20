export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const plans: Plan[] = [
  {
    id: "basic-programming",
    name: "Programação (Básico)",
    description: "Aprenda programação com nosso curso básico",
    price: 2990, // in cents
    features: [
      "Acesso a todos os cursos básicos de programação",
      "Exercícios práticos",
      "Certificado de conclusão",
      "Suporte via comunidade"
    ]
  },
  {
    id: "basic-bundle",
    name: "Programação + Inglês (Básico)",
    description: "Combo de programação e inglês para iniciantes",
    price: 4990,
    features: [
      "Todos os benefícios do plano básico de programação",
      "Curso completo de inglês",
      "Exercícios de conversação",
      "Material didático em inglês"
    ]
  },
  {
    id: "tutor-programming",
    name: "Programação (Com Tutor)",
    description: "Aprenda programação com acompanhamento personalizado",
    price: 19990,
    features: [
      "Todos os benefícios do plano básico",
      "Mentor dedicado",
      "Sessões semanais de tutoria",
      "Revisão de código personalizada",
      "Projetos práticos guiados"
    ]
  },
  {
    id: "tutor-bundle",
    name: "Programação + Inglês (Com Tutor)",
    description: "A experiência completa de aprendizado",
    price: 29990,
    features: [
      "Todos os benefícios dos planos com tutor",
      "Tutor de inglês dedicado",
      "Sessões de conversação em inglês",
      "Projetos combinando programação e inglês",
      "Suporte prioritário"
    ]
  }
];
