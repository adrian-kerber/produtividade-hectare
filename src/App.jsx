import { useState } from 'react';
import './App.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import jsPDF from 'jspdf';

function App() {
  const [area, setArea] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState('sacas');
  const [nomeLote, setNomeLote] = useState('');
  const [cultivar, setCultivar] = useState('');
  const [resultado, setResultado] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [exibirPor, setExibirPor] = useState('lote');

  const calcularProdutividade = () => {
    const areaNum = parseFloat(area);
    let quantidadeNum = parseFloat(quantidade);

    if (isNaN(areaNum) || isNaN(quantidadeNum) || areaNum <= 0) {
      setResultado('Por favor, preencha os campos corretamente.');
      return;
    }

    if (unidade === 'kg') {
      quantidadeNum = quantidadeNum / 60;
    }

    const produtividade = quantidadeNum / areaNum;
    const prodFormatada = produtividade.toFixed(2);

    setResultado(`Produtividade: ${prodFormatada} sacas/ha`);

    setHistorico([
      ...historico,
      {
        nome: nomeLote.trim() !== '' ? nomeLote : `Lote ${historico.length + 1}`,
        cultivar: cultivar.trim() !== '' ? cultivar : 'Cultivar não informada',
        produtividade: Number(prodFormatada),
      },
    ]);
  };

  const exportarGrafico = () => {
    const graficoEl = document.getElementById('grafico');

    toPng(graficoEl)
      .then((dataUrl) => {
        download(dataUrl, 'grafico-produtividade.png');
      })
      .catch((err) => {
        console.error('Erro ao exportar imagem', err);
      });
  };

const exportarPDF = async () => {
  const graficoEl = document.getElementById('grafico');

  try {
    const dataUrl = await toPng(graficoEl);
    const pdf = new jsPDF();

    // 🧠 Encontrar cultivar com maior produtividade
    const melhorCultivar = [...historico]
      .filter(h => h.cultivar)
      .reduce((top, curr) => curr.produtividade > top.produtividade ? curr : top, historico[0]);

    // 📝 Texto do relatório
    pdf.setFontSize(18);
    pdf.text("Relatório de Produtividade", 15, 20);

    pdf.setFontSize(12);
    pdf.text(`Total de registros: ${historico.length}`, 15, 35);
    pdf.text(`Cultivar com maior produtividade: ${melhorCultivar.cultivar} (${melhorCultivar.produtividade.toFixed(2)} sacas/ha)`, 15, 45);

    pdf.text("Resumo por lote:", 15, 60);
    historico.forEach((item, index) => {
      pdf.text(
        `${index + 1}. ${item.nome} – Cultivar: ${item.cultivar} – ${item.produtividade.toFixed(2)} sacas/ha`,
        15,
        70 + index * 10
      );
    });

    // Inserir o gráfico como imagem (abaixo do conteúdo)
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.text("Gráfico de Produtividade", 15, 20);
    pdf.addImage(dataUrl, 'PNG', 15, 30, 180, 100);

    pdf.save('relatorio-produtividade.pdf');
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
  }
};


  const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#2e2e2e',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Produtividade:</strong> {payload[0].value.toFixed(2)} sacas/ha</p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
          {exibirPor === 'cultivar' ? '(Média por cultivar)' : ''}
        </p>
      </div>
    );
  }

  return null;
};


  const dadosGrafico = exibirPor === 'cultivar'
  ? Object.values(
      historico.reduce((acc, item) => {
        if (!acc[item.cultivar]) {
          acc[item.cultivar] = {
            cultivar: item.cultivar,
            produtividadeTotal: 0,
            count: 0,
          };
        }
        acc[item.cultivar].produtividadeTotal += item.produtividade;
        acc[item.cultivar].count += 1;
        return acc;
      }, {})
    ).map((item) => ({
      cultivar: item.cultivar,
      produtividade: item.produtividadeTotal / item.count,
    }))
  : historico;

  return (
    <div className="container">
      <h1>Calculadora de Produtividade</h1>

      <div className="input-group">
        <label>Área Plantada (hectares):</label>
        <input
          type="number"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Ex: 10"
        />
      </div>

      <div className="input-group">
        <label>Nome do Lote:</label>
        <input
          type="text"
          value={nomeLote}
          onChange={(e) => setNomeLote(e.target.value)}
          placeholder="Ex: Talhão A"
        />
      </div>

      <div className="input-group">
        <label>Cultivar:</label>
        <input
          type="text"
          value={cultivar}
          onChange={(e) => setCultivar(e.target.value)}
          placeholder="Ex: BRS1010"
        />
      </div>

      <div className="input-group">
        <label>Quantidade Colhida:</label>
        <input
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          placeholder="Ex: 550"
        />

        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="sacas"
              checked={unidade === 'sacas'}
              onChange={(e) => setUnidade(e.target.value)}
            />
            Sacas
          </label>
          <label>
            <input
              type="radio"
              value="kg"
              checked={unidade === 'kg'}
              onChange={(e) => setUnidade(e.target.value)}
            />
            Kg
          </label>
        </div>
      </div>

      <button onClick={calcularProdutividade}>Calcular</button>

      {resultado && <p className="resultado">{resultado}</p>}

      {historico.length > 0 && (
        <>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="lote"
                checked={exibirPor === 'lote'}
                onChange={(e) => setExibirPor(e.target.value)}
              />
              Exibir por Lote
            </label>
            <label>
              <input
                type="radio"
                value="cultivar"
                checked={exibirPor === 'cultivar'}
                onChange={(e) => setExibirPor(e.target.value)}
              />
              Exibir por Cultivar
            </label>
          </div>

          <div className="grafico" id="grafico">
            <h2>Histórico de Produtividade</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosGrafico}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={exibirPor === 'lote' ? 'nome' : 'cultivar'} />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="produtividade" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button className="exportar-btn" onClick={exportarGrafico}>
            Exportar gráfico como imagem
          </button>
          <button className="exportar-btn" onClick={exportarPDF}>
  Exportar relatório em PDF
</button>

        </>
      )}
    </div>
  );
}

export default App;
