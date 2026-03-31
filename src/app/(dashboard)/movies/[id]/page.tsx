export default function MovieDetailPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Movie Details</h1>
      <p>Movie ID: {params.id}</p>
    </div>
  );
}
