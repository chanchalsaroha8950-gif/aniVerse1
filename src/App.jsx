import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Series from './pages/Series.jsx';
import Episode from './pages/Episode.jsx';
import Movie from './pages/Movie.jsx';
import Collections from './pages/Collections.jsx';
import NotFound from './pages/NotFound.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-skin text-skin transition-colors duration-theme">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/collection" element={<Collections />} />
          <Route path="/series/:id" element={<Series />} />
          <Route path="/series/:id/episode/:episodeId" element={<Episode />} />
          <Route path="/movie/:id" element={<Movie />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
