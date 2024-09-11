import styles from './feedback.module.css';
import { useState } from 'react';
import apiUsuarios from '../../service/usuario';

const Feedback = (localParametro) => {
    const [local, setLocal] = useState("SENAI");
    const [nota, setNota] = useState(0);
    const [observacao, setObservacao] = useState('');
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        const usuario = {
            local,
            nota,
            observacao,
            data: new Date().toISOString().split('T')[0], // Data automática no formato YYYY-MM-DD
        };

        try {
            await apiUsuarios.createUsuario(usuario);
            alert('Feedback enviado com sucesso!');
        } catch (error) {
            console.error("Erro ao enviar feedback:", error.message);
            alert('Erro ao enviar feedback.');
        }
    };

    return (
        <div className={styles.card}>
            <h2>Em uma escala de 0 a 10, o quanto você recomendaria nosso serviço?</h2>
            <div className={styles.scale}>
                {[...Array(11).keys()].map((num) => (
                    <button
                        key={num}
                        className={num === nota ? styles.selected : ''}
                        onClick={() => setNota(num)}
                    >
                        {num}
                        
                    </button>
                ))}
            </div>
            <p>Não Satisfeito</p>
            <p>Satisfeito</p>
            <textarea
                placeholder="Fale como podemos melhorar (opcional)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
            />
            <button className={styles.submit} onClick={handleSubmit}>Enviar</button>
        </div>
    );
}

export default Feedback;