import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Building2, Calendar } from "lucide-react";

// Schema for project form
const projectFormSchema = z.object({
  developerId: z.string().min(1, "נדרש לבחור קבלן"),
  title: z.string().min(1, "נדרש שם פרויקט"),
  slug: z.string().min(1, "נדרש slug"),
  city: z.string().min(1, "נדרשת עיר"),
  region: z.string().min(1, "נדרש אזור"),
  addressText: z.string().min(1, "נדרשת כתובת"),
  description: z.string().min(1, "נדרש תיאור"),
  coverImage: z.string().url("נדרש קישור תקין לתמונה"),
  expectedDeliveryDate: z.string().min(1, "נדרש תאריך מסירה"),
  totalCapacity: z.coerce.number().min(1, "נדרשת קיבולת"),
  waitingListCapacity: z.coerce.number().min(1, "נדרשת קיבולת רשימת המתנה"),
  marketPriceBaseline: z.coerce.number().min(1, "נדרש מחיר בסיס"),
  currentStage: z.string().min(1, "נדרש שלב"),
  legalDisclaimer: z.string().optional(),
  // Stage deadline dates
  earlyRegistrationEnd: z.string().optional(),
  webinarDeadline: z.string().optional(),
  finalRegistrationEnd: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectFormSchema>;

interface Developer {
  id: string;
  name: string;
}

interface RealEstateProject {
  id: string;
  developerId: string;
  title: string;
  slug: string;
  city: string;
  region: string;
  addressText: string;
  description: string;
  coverImage: string;
  expectedDeliveryDate: string;
  totalCapacity: number;
  waitingListCapacity: number;
  currentRegistrantCount: number;
  currentWaitingListCount: number;
  marketPriceBaseline: number;
  currentStage: string;
  earlyRegistrationEnd: string | null;
  webinarDeadline: string | null;
  finalRegistrationEnd: string | null;
  status: string;
}

export default function AdminRealEstatePage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<RealEstateProject | null>(null);

  // Fetch developers
  const { data: developers = [] } = useQuery<Developer[]>({
    queryKey: ["admin-developers"],
    queryFn: () => apiRequest("/api/admin/developers"),
  });

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<RealEstateProject[]>({
    queryKey: ["admin-projects"],
    queryFn: async () => {
      const data = await apiRequest("/api/real-estate/projects");
      return data.projects;
    },
  });

  // Create/Update project mutation
  const projectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const url = editingProject
        ? `/api/admin/projects/${editingProject.id}`
        : "/api/admin/projects";
      
      return apiRequest(url, {
        method: editingProject ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({
        title: editingProject ? "✅ הפרויקט עודכן בהצלחה" : "✅ הפרויקט נוצר בהצלחה",
      });
      setIsDialogOpen(false);
      setEditingProject(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "❌ שגיאה",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      currentStage: "PRE_REGISTRATION",
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    projectMutation.mutate(data);
  };

  const handleEdit = (project: RealEstateProject) => {
    setEditingProject(project);
    form.reset({
      developerId: project.developerId,
      title: project.title,
      slug: project.slug,
      city: project.city,
      region: project.region,
      addressText: project.addressText,
      description: project.description,
      coverImage: project.coverImage,
      expectedDeliveryDate: project.expectedDeliveryDate
        ? new Date(project.expectedDeliveryDate).toISOString().split("T")[0]
        : "",
      totalCapacity: project.totalCapacity,
      waitingListCapacity: project.waitingListCapacity,
      marketPriceBaseline: project.marketPriceBaseline,
      currentStage: project.currentStage,
      legalDisclaimer: project.legalDisclaimer || "",
      earlyRegistrationEnd: project.earlyRegistrationEnd
        ? new Date(project.earlyRegistrationEnd).toISOString().slice(0, 16)
        : "",
      webinarDeadline: project.webinarDeadline
        ? new Date(project.webinarDeadline).toISOString().slice(0, 16)
        : "",
      finalRegistrationEnd: project.finalRegistrationEnd
        ? new Date(project.finalRegistrationEnd).toISOString().slice(0, 16)
        : "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProject(null);
    form.reset({
      currentStage: "PRE_REGISTRATION",
    });
    setIsDialogOpen(true);
  };

  const getStageLabel = (stage: string) => {
    const stages = {
      PRE_REGISTRATION: "רישום מקדים",
      WEBINAR_SCHEDULED: "כנס רוכשים",
      FOMO_CONFIRMATION_WINDOW: "רישום סופי",
      REGISTRATION_CLOSED: "רישום סגור",
    };
    return stages[stage as keyof typeof stages] || stage;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-[#7B2FF7]" />
            ניהול פרויקטי נדל"ן
          </h1>
          <p className="text-gray-600 mt-1">הוסף וערוך פרויקטים בקבוצות הרכישה</p>
        </div>
        <Button onClick={handleAddNew} className="gap-2">
          <Plus className="h-4 w-4" />
          פרויקט חדש
        </Button>
      </div>

      {/* Projects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>טוען...</div>
        ) : projects.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <p className="text-gray-500">אין עדיין פרויקטים במערכת</p>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                <img
                  src={project.coverImage}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2">{project.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{project.city}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">שלב:</span>
                    <span className="font-semibold">
                      {getStageLabel(project.currentStage)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">נרשמים:</span>
                    <span className="font-semibold">
                      {project.currentRegistrantCount} / {project.totalCapacity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">מחיר בסיס:</span>
                    <span className="font-semibold">
                      ₪{project.marketPriceBaseline.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button
                    onClick={() => handleEdit(project)}
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    ערוך
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "עריכת פרויקט" : "הוספת פרויקט חדש"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Developer Selection */}
            <div className="space-y-2">
              <Label htmlFor="developerId">קבלן *</Label>
              <select
                id="developerId"
                {...form.register("developerId")}
                className="w-full border rounded-md p-2"
              >
                <option value="">בחר קבלן</option>
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.developerId && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.developerId.message}
                </p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">שם הפרויקט *</Label>
                <Input id="title" {...form.register("title")} />
                {form.formState.errors.title && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <Input id="slug" {...form.register("slug")} />
                {form.formState.errors.slug && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.slug.message}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">עיר *</Label>
                <Input id="city" {...form.register("city")} />
                {form.formState.errors.city && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">אזור *</Label>
                <select
                  id="region"
                  {...form.register("region")}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">בחר אזור</option>
                  <option value="צפון">צפון</option>
                  <option value="מרכז">מרכז</option>
                  <option value="דרום">דרום</option>
                </select>
                {form.formState.errors.region && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.region.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="addressText">כתובת *</Label>
                <Input id="addressText" {...form.register("addressText")} />
                {form.formState.errors.addressText && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.addressText.message}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">תיאור הפרויקט *</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                rows={4}
              />
              {form.formState.errors.description && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImage">תמונת שער (URL) *</Label>
              <Input
                id="coverImage"
                type="url"
                {...form.register("coverImage")}
                placeholder="https://..."
              />
              {form.formState.errors.coverImage && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.coverImage.message}
                </p>
              )}
            </div>

            {/* Capacity & Price */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalCapacity">קיבולת כוללת *</Label>
                <Input
                  id="totalCapacity"
                  type="number"
                  {...form.register("totalCapacity")}
                />
                {form.formState.errors.totalCapacity && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.totalCapacity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="waitingListCapacity">קיבולת המתנה *</Label>
                <Input
                  id="waitingListCapacity"
                  type="number"
                  {...form.register("waitingListCapacity")}
                />
                {form.formState.errors.waitingListCapacity && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.waitingListCapacity.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketPriceBaseline">מחיר בסיס (₪) *</Label>
                <Input
                  id="marketPriceBaseline"
                  type="number"
                  {...form.register("marketPriceBaseline")}
                />
                {form.formState.errors.marketPriceBaseline && (
                  <p className="text-red-500 text-sm">
                    {form.formState.errors.marketPriceBaseline.message}
                  </p>
                )}
              </div>
            </div>

            {/* Expected Delivery Date */}
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">תאריך מסירה צפוי *</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                {...form.register("expectedDeliveryDate")}
              />
              {form.formState.errors.expectedDeliveryDate && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.expectedDeliveryDate.message}
                </p>
              )}
            </div>

            {/* Current Stage */}
            <div className="space-y-2">
              <Label htmlFor="currentStage">שלב נוכחי *</Label>
              <select
                id="currentStage"
                {...form.register("currentStage")}
                className="w-full border rounded-md p-2"
              >
                <option value="PRE_REGISTRATION">רישום מקדים</option>
                <option value="WEBINAR_SCHEDULED">כנס רוכשים</option>
                <option value="FOMO_CONFIRMATION_WINDOW">רישום סופי</option>
                <option value="REGISTRATION_CLOSED">רישום סגור</option>
              </select>
              {form.formState.errors.currentStage && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.currentStage.message}
                </p>
              )}
            </div>

            {/* STAGE DEADLINES - NEW SECTION */}
            <div className="border-t pt-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-[#7B2FF7]" />
                <h3 className="text-lg font-semibold">תאריכי סיום שלבים</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                הגדר תאריך סיום לכל שלב בתהליך הרכישה. הטיימרים יוצגו במסך הפרויקט.
              </p>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2 bg-purple-50 p-4 rounded-lg">
                  <Label htmlFor="earlyRegistrationEnd" className="font-semibold">
                    תאריך סיום רישום מקדים
                  </Label>
                  <Input
                    id="earlyRegistrationEnd"
                    type="datetime-local"
                    {...form.register("earlyRegistrationEnd")}
                  />
                  <p className="text-xs text-gray-600">
                    יוצג כטיימר כאשר הפרויקט בשלב "רישום מקדים"
                  </p>
                </div>

                <div className="space-y-2 bg-blue-50 p-4 rounded-lg">
                  <Label htmlFor="webinarDeadline" className="font-semibold">
                    תאריך סיום כנס רוכשים
                  </Label>
                  <Input
                    id="webinarDeadline"
                    type="datetime-local"
                    {...form.register("webinarDeadline")}
                  />
                  <p className="text-xs text-gray-600">
                    יוצג כטיימר כאשר הפרויקט בשלב "כנס רוכשים"
                  </p>
                </div>

                <div className="space-y-2 bg-orange-50 p-4 rounded-lg">
                  <Label htmlFor="finalRegistrationEnd" className="font-semibold">
                    תאריך סיום רישום סופי
                  </Label>
                  <Input
                    id="finalRegistrationEnd"
                    type="datetime-local"
                    {...form.register("finalRegistrationEnd")}
                  />
                  <p className="text-xs text-gray-600">
                    יוצג כטיימר כאשר הפרויקט בשלב "רישום סופי"
                  </p>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
                <p className="font-semibold mb-2">💡 הערה חשובה:</p>
                <p>
                  בשלב "רישום סגור" לא יוצג טיימר, כיוון שתהליך המכירה הסתיים מבחינת DealRush.
                </p>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="space-y-2">
              <Label htmlFor="legalDisclaimer">הצהרה משפטית (אופציונלי)</Label>
              <Textarea
                id="legalDisclaimer"
                {...form.register("legalDisclaimer")}
                rows={2}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingProject(null);
                  form.reset();
                }}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={projectMutation.isPending}
                className="bg-[#7B2FF7] hover:bg-purple-700"
              >
                {projectMutation.isPending
                  ? "שומר..."
                  : editingProject
                  ? "עדכן פרויקט"
                  : "צור פרויקט"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
