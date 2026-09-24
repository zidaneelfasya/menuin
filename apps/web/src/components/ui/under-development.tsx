import { Construction } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';

export function UnderDevelopment({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md text-center border-dashed border-2">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="bg-muted p-4 rounded-full">
              <Construction className="h-10 w-10 text-muted-foreground" />
            </div>
          </div>
          <CardTitle className="text-xl">Modul {title}</CardTitle>
          <CardDescription className="text-base mt-2">
            Modul ini masih dalam proses pengembangan.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
